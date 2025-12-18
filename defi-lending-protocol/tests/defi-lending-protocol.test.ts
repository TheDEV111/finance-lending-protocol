import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const user1 = accounts.get("wallet_1")!;
const user2 = accounts.get("wallet_2")!;
const liquidator = accounts.get("wallet_3")!;

describe("DeFi Lending Protocol - Integration Tests", () => {
  beforeEach(() => {
    simnet.setEpoch("3.0");
  });

  describe("Lending Pool Contract", () => {
    it("allows users to deposit collateral", () => {
      const depositAmount = 1000000; // 1 STX

      const { result } = simnet.callPublicFn(
        "lending-pool",
        "deposit-collateral",
        [Cl.uint(depositAmount)],
        user1
      );

      expect(result).toBeOk(Cl.bool(true));

      // Verify position
      const position = simnet.callReadOnlyFn(
        "lending-pool",
        "get-user-position",
        [Cl.principal(user1)],
        user1
      );

      expect(position.result).toBeTuple({
        collateral: Cl.uint(depositAmount),
        borrowed: Cl.uint(0),
        "interest-index": Cl.uint(1000000),
        "last-interaction-block": Cl.uint(simnet.blockHeight),
      });
    });

    it("allows users to borrow against collateral", () => {
      const depositAmount = 10000000; // 10 STX
      const borrowAmount = 5000000; // 5 STX (50% of collateral, within 75% limit)

      // First deposit collateral
      simnet.callPublicFn(
        "lending-pool",
        "deposit-collateral",
        [Cl.uint(depositAmount)],
        user1
      );

      // Then borrow
      const { result } = simnet.callPublicFn(
        "lending-pool",
        "borrow-funds",
        [Cl.uint(borrowAmount)],
        user1
      );

      expect(result).toBeOk(Cl.bool(true));

      // Verify borrowed amount
      const position = simnet.callReadOnlyFn(
        "lending-pool",
        "get-user-position",
        [Cl.principal(user1)],
        user1
      );

      const borrowed = Cl.tuple(position.result).borrowed;
      expect(borrowed).toEqual(Cl.uint(borrowAmount));
    });

    it("prevents borrowing more than collateral ratio allows", () => {
      const depositAmount = 10000000; // 10 STX
      const borrowAmount = 8000000; // 8 STX (80% of collateral, exceeds 75% limit)

      // Deposit collateral
      simnet.callPublicFn(
        "lending-pool",
        "deposit-collateral",
        [Cl.uint(depositAmount)],
        user1
      );

      // Try to borrow too much
      const { result } = simnet.callPublicFn(
        "lending-pool",
        "borrow-funds",
        [Cl.uint(borrowAmount)],
        user1
      );

      expect(result).toBeErr(Cl.uint(101)); // ERR_INSUFFICIENT_COLLATERAL
    });

    it("allows users to repay loans", () => {
      const depositAmount = 10000000; // 10 STX
      const borrowAmount = 5000000; // 5 STX
      const repayAmount = 3000000; // 3 STX

      // Setup: deposit and borrow
      simnet.callPublicFn(
        "lending-pool",
        "deposit-collateral",
        [Cl.uint(depositAmount)],
        user1
      );

      simnet.callPublicFn(
        "lending-pool",
        "borrow-funds",
        [Cl.uint(borrowAmount)],
        user1
      );

      // Repay partial loan
      const { result } = simnet.callPublicFn(
        "lending-pool",
        "repay-loan",
        [Cl.uint(repayAmount)],
        user1
      );

      expect(result).toBeOk(Cl.uint(repayAmount));

      // Verify remaining debt
      const debt = simnet.callReadOnlyFn(
        "lending-pool",
        "calculate-current-debt",
        [Cl.principal(user1)],
        user1
      );

      expect(debt.result).toEqual(Cl.uint(borrowAmount - repayAmount));
    });

    it("allows users to withdraw collateral after repaying", () => {
      const depositAmount = 10000000; // 10 STX
      const borrowAmount = 5000000; // 5 STX
      const withdrawAmount = 2000000; // 2 STX

      // Setup: deposit, borrow, repay
      simnet.callPublicFn(
        "lending-pool",
        "deposit-collateral",
        [Cl.uint(depositAmount)],
        user1
      );

      simnet.callPublicFn(
        "lending-pool",
        "borrow-funds",
        [Cl.uint(borrowAmount)],
        user1
      );

      simnet.callPublicFn(
        "lending-pool",
        "repay-loan",
        [Cl.uint(borrowAmount)],
        user1
      );

      // Withdraw collateral
      const { result } = simnet.callPublicFn(
        "lending-pool",
        "withdraw-collateral",
        [Cl.uint(withdrawAmount)],
        user1
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("prevents withdrawal that would violate health factor", () => {
      const depositAmount = 10000000; // 10 STX
      const borrowAmount = 7000000; // 7 STX (70% utilization)
      const withdrawAmount = 5000000; // Try to withdraw 5 STX

      // Setup
      simnet.callPublicFn(
        "lending-pool",
        "deposit-collateral",
        [Cl.uint(depositAmount)],
        user1
      );

      simnet.callPublicFn(
        "lending-pool",
        "borrow-funds",
        [Cl.uint(borrowAmount)],
        user1
      );

      // Try to withdraw too much
      const { result } = simnet.callPublicFn(
        "lending-pool",
        "withdraw-collateral",
        [Cl.uint(withdrawAmount)],
        user1
      );

      expect(result).toBeErr(Cl.uint(105)); // ERR_HEALTH_FACTOR_TOO_LOW
    });

    it("calculates health factor correctly", () => {
      const depositAmount = 10000000; // 10 STX
      const borrowAmount = 5000000; // 5 STX

      simnet.callPublicFn(
        "lending-pool",
        "deposit-collateral",
        [Cl.uint(depositAmount)],
        user1
      );

      simnet.callPublicFn(
        "lending-pool",
        "borrow-funds",
        [Cl.uint(borrowAmount)],
        user1
      );

      const healthFactor = simnet.callReadOnlyFn(
        "lending-pool",
        "get-health-factor",
        [Cl.principal(user1)],
        user1
      );

      // Health factor = (collateral * 0.75) / debt * 100
      // = (10000000 * 0.75) / 5000000 * 100 = 150
      expect(healthFactor.result).toEqual(Cl.uint(150));
    });
  });

  describe("Interest Calculator Contract", () => {
    it("calculates interest rates based on utilization", () => {
      // Setup pool with some utilization
      const depositAmount = 100000000; // 100 STX
      const borrowAmount = 40000000; // 40 STX (40% utilization)

      simnet.callPublicFn(
        "lending-pool",
        "deposit-collateral",
        [Cl.uint(depositAmount)],
        user1
      );

      simnet.callPublicFn(
        "lending-pool",
        "borrow-funds",
        [Cl.uint(borrowAmount)],
        user1
      );

      // Check interest rate
      const rate = simnet.callReadOnlyFn(
        "interest-calculator",
        "get-current-rate",
        [],
        user1
      );

      // Rate should be between base rate and optimal rate
      expect(Number(Cl.uint(rate.result))).toBeGreaterThan(2000000); // > 2%
      expect(Number(Cl.uint(rate.result))).toBeLessThan(10000000); // < 10%
    });

    it("increases rates as utilization approaches optimal", () => {
      const depositAmount = 100000000; // 100 STX

      simnet.callPublicFn(
        "lending-pool",
        "deposit-collateral",
        [Cl.uint(depositAmount)],
        user1
      );

      // Low utilization borrow
      simnet.callPublicFn(
        "lending-pool",
        "borrow-funds",
        [Cl.uint(20000000)],
        user1
      );

      const lowUtilRate = simnet.callReadOnlyFn(
        "interest-calculator",
        "get-current-rate",
        [],
        user1
      );

      // Higher utilization
      simnet.callPublicFn(
        "lending-pool",
        "borrow-funds",
        [Cl.uint(40000000)],
        user1
      );

      const highUtilRate = simnet.callReadOnlyFn(
        "interest-calculator",
        "get-current-rate",
        [],
        user1
      );

      expect(Number(Cl.uint(highUtilRate.result))).toBeGreaterThan(
        Number(Cl.uint(lowUtilRate.result))
      );
    });

    it("updates rates when called", () => {
      const { result } = simnet.callPublicFn(
        "interest-calculator",
        "update-rates",
        [],
        user1
      );

      expect(result).toBeOk(
        Cl.tuple({
          utilization: Cl.uint(0),
          "borrow-rate": Cl.uint(2000000),
          "supply-rate": Cl.uint(0),
        })
      );
    });
  });

  describe("Collateral Manager Contract", () => {
    it("calculates health factor for positions", () => {
      const depositAmount = 10000000; // 10 STX
      const borrowAmount = 5000000; // 5 STX

      simnet.callPublicFn(
        "lending-pool",
        "deposit-collateral",
        [Cl.uint(depositAmount)],
        user1
      );

      simnet.callPublicFn(
        "lending-pool",
        "borrow-funds",
        [Cl.uint(borrowAmount)],
        user1
      );

      const healthFactor = simnet.callReadOnlyFn(
        "collateral-manager",
        "check-health-factor",
        [Cl.principal(user1)],
        user1
      );

      expect(healthFactor.result).toBeOk(Cl.uint(150)); // 1.5 health factor
    });

    it("identifies liquidatable positions", () => {
      const depositAmount = 10000000; // 10 STX
      const borrowAmount = 7400000; // 7.4 STX (close to limit)

      simnet.callPublicFn(
        "lending-pool",
        "deposit-collateral",
        [Cl.uint(depositAmount)],
        user1
      );

      simnet.callPublicFn(
        "lending-pool",
        "borrow-funds",
        [Cl.uint(borrowAmount)],
        user1
      );

      const isLiquidatable = simnet.callReadOnlyFn(
        "collateral-manager",
        "is-liquidatable",
        [Cl.principal(user1)],
        user1
      );

      // Should be liquidatable if health factor < 1.0
      expect(isLiquidatable.result).toBeOk(Cl.bool(true));
    });

    it("calculates liquidation amounts correctly", () => {
      const depositAmount = 10000000; // 10 STX
      const borrowAmount = 7400000; // 7.4 STX

      simnet.callPublicFn(
        "lending-pool",
        "deposit-collateral",
        [Cl.uint(depositAmount)],
        user1
      );

      simnet.callPublicFn(
        "lending-pool",
        "borrow-funds",
        [Cl.uint(borrowAmount)],
        user1
      );

      const liquidationAmount = simnet.callReadOnlyFn(
        "collateral-manager",
        "calculate-liquidation-amount",
        [Cl.principal(user1)],
        user1
      );

      expect(liquidationAmount.result).toBeOk(
        Cl.tuple({
          "debt-to-repay": Cl.uint(borrowAmount / 2),
          "collateral-to-seize": Cl.uint((borrowAmount / 2) * 1.05),
        })
      );
    });

    it("tracks liquidation events", () => {
      const depositAmount = 10000000; // 10 STX
      const borrowAmount = 7400000; // 7.4 STX

      simnet.callPublicFn(
        "lending-pool",
        "deposit-collateral",
        [Cl.uint(depositAmount)],
        user1
      );

      simnet.callPublicFn(
        "lending-pool",
        "borrow-funds",
        [Cl.uint(borrowAmount)],
        user1
      );

      // Perform liquidation
      const { result } = simnet.callPublicFn(
        "collateral-manager",
        "liquidate-position",
        [Cl.principal(user1), Cl.uint(3700000)],
        liquidator
      );

      expect(result).toBeOk(
        Cl.tuple({
          "collateral-seized": Cl.uint(3885000),
          "debt-repaid": Cl.uint(3700000),
          "liquidation-id": Cl.uint(1),
        })
      );
    });

    it("maintains liquidation statistics", () => {
      const stats = simnet.callReadOnlyFn(
        "collateral-manager",
        "get-liquidation-stats",
        [],
        user1
      );

      expect(stats.result).toBeTuple({
        "total-liquidations": Cl.uint(0),
        "total-collateral-seized": Cl.uint(0),
        "total-debt-repaid": Cl.uint(0),
      });
    });
  });

  describe("Price Oracle Contract", () => {
    it("returns current STX price", () => {
      const price = simnet.callReadOnlyFn(
        "price-oracle",
        "get-latest-price",
        [Cl.stringAscii("STX")],
        user1
      );

      expect(price.result).toBeOk(Cl.uint(1000000)); // $1.00
    });

    it("allows authorized oracles to update prices", () => {
      // First authorize the deployer as oracle
      simnet.callPublicFn(
        "price-oracle",
        "authorize-oracle",
        [Cl.principal(deployer)],
        deployer
      );

      const newPrice = 1500000; // $1.50

      const { result } = simnet.callPublicFn(
        "price-oracle",
        "update-price",
        [Cl.stringAscii("STX"), Cl.uint(newPrice), Cl.stringAscii("TEST")],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));

      // Verify price was updated
      const price = simnet.callReadOnlyFn(
        "price-oracle",
        "get-latest-price",
        [Cl.stringAscii("STX")],
        user1
      );

      expect(price.result).toBeOk(Cl.uint(newPrice));
    });

    it("prevents unauthorized price updates", () => {
      const newPrice = 1500000; // $1.50

      const { result } = simnet.callPublicFn(
        "price-oracle",
        "update-price",
        [Cl.stringAscii("STX"), Cl.uint(newPrice), Cl.stringAscii("TEST")],
        user1
      );

      expect(result).toBeErr(Cl.uint(404)); // ERR_ORACLE_NOT_AUTHORIZED
    });

    it("validates price is fresh", () => {
      const isFresh = simnet.callReadOnlyFn(
        "price-oracle",
        "is-price-fresh",
        [Cl.stringAscii("STX")],
        user1
      );

      expect(isFresh.result).toBeOk(Cl.bool(true));
    });

    it("allows admin to add new supported assets", () => {
      const { result } = simnet.callPublicFn(
        "price-oracle",
        "add-supported-asset",
        [
          Cl.stringAscii("BTC"),
          Cl.uint(30000000000), // $30,000
          Cl.uint(100000000000), // $100,000
          Cl.uint(6),
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("allows admin to pause oracle in emergency", () => {
      const { result } = simnet.callPublicFn(
        "price-oracle",
        "set-emergency-pause",
        [Cl.bool(true)],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));

      const isPaused = simnet.callReadOnlyFn(
        "price-oracle",
        "is-emergency-paused",
        [],
        user1
      );

      expect(isPaused.result).toEqual(Cl.bool(true));
    });
  });

  describe("Full User Journey", () => {
    it("completes full deposit -> borrow -> repay -> withdraw cycle", () => {
      const depositAmount = 20000000; // 20 STX
      const borrowAmount = 10000000; // 10 STX
      const repayAmount = 10000000; // 10 STX
      const withdrawAmount = 15000000; // 15 STX

      // 1. Deposit collateral
      let result = simnet.callPublicFn(
        "lending-pool",
        "deposit-collateral",
        [Cl.uint(depositAmount)],
        user1
      );
      expect(result.result).toBeOk(Cl.bool(true));

      // 2. Borrow funds
      result = simnet.callPublicFn(
        "lending-pool",
        "borrow-funds",
        [Cl.uint(borrowAmount)],
        user1
      );
      expect(result.result).toBeOk(Cl.bool(true));

      // 3. Repay loan
      result = simnet.callPublicFn(
        "lending-pool",
        "repay-loan",
        [Cl.uint(repayAmount)],
        user1
      );
      expect(result.result).toBeOk(Cl.uint(repayAmount));

      // 4. Withdraw collateral
      result = simnet.callPublicFn(
        "lending-pool",
        "withdraw-collateral",
        [Cl.uint(withdrawAmount)],
        user1
      );
      expect(result.result).toBeOk(Cl.bool(true));

      // Verify final position
      const position = simnet.callReadOnlyFn(
        "lending-pool",
        "get-user-position",
        [Cl.principal(user1)],
        user1
      );

      expect(Cl.tuple(position.result).collateral).toEqual(
        Cl.uint(depositAmount - withdrawAmount)
      );
      expect(Cl.tuple(position.result).borrowed).toEqual(Cl.uint(0));
    });
  });
});
