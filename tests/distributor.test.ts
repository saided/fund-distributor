import {
  distributeFunds,
  SOURCE_ACCOUNT,
  TARGETS_BY_ID,
  AccountId,
} from "../src/distributor";

//  Fresh copies
function freshSource() { 
  return { ...SOURCE_ACCOUNT }; 
}

function freshTargets() {
  return {
    "target-001": { ...TARGETS_BY_ID["target-001"] },
    "target-002": { ...TARGETS_BY_ID["target-002"] },
    "target-003": { ...TARGETS_BY_ID["target-003"] },
  };
}

//  Tests
describe("distributeFunds", () => {

  describe("Even Mode", () => {

    describe("Validation", () => {

      it("should throw if targets is an empty array", () => {
        expect(() =>
          distributeFunds(freshSource(), freshTargets(), {
            mode: "even",
            targets: [],
          })
        ).toThrow("At least provide one target");
      });

      it("should throw if more than 3 targets provided", () => {
        expect(() =>
          distributeFunds(freshSource(), freshTargets(), {
            mode: "even",
            targets: ["target-001", "target-002", "target-003", "target-001" as any],
          })
        ).toThrow("Number of targets cannot exceed 3.");
      });

      it("should throw if unknown target ID provided", () => {
        expect(() =>
          distributeFunds(freshSource(), freshTargets(), {
            mode: "even",
            targets: ["target-999" as any],
          })
        ).toThrow('Invalid target account ID: "target-999".');
      });

      it("should throw if duplicate target IDs provided", () => {
        expect(() =>
          distributeFunds(freshSource(), freshTargets(), {
            mode: "even",
            targets: ["target-001", "target-001"],
          })
        ).toThrow("Duplicate target IDs are not allowed.");
      });

    });

    describe("Calculation", () => {

      it("should split $10,000 evenly across all 3 targets", () => {
        const result = distributeFunds(freshSource(), freshTargets(), {
          mode: "even",
          targets: ["target-001", "target-002", "target-003"],
        });

        expect(result.sourceBalance).toBe(0);
        expect(result.distributions).toHaveLength(3);
        expect(result.distributions[0].amount).toBe(333334); // $3,333.34
        expect(result.distributions[1].amount).toBe(333333); // $3,333.33
        expect(result.distributions[2].amount).toBe(333333); // $3,333.33
      });

      it("should default to all 3 targets if none provided", () => {
        const result = distributeFunds(freshSource(), freshTargets(), {
          mode: "even",
        });

        expect(result.sourceBalance).toBe(0);
        expect(result.distributions).toHaveLength(3);
      });

      it("should split evenly across subset of 2 targets", () => {
        const result = distributeFunds(freshSource(), freshTargets(), {
          mode: "even",
          targets: ["target-001", "target-003"],
        });

        expect(result.sourceBalance).toBe(0);
        expect(result.distributions).toHaveLength(2);
        expect(result.distributions[0].amount).toBe(500000); // $5,000.00
        expect(result.distributions[1].amount).toBe(500000); // $5,000.00
      });

      it("should send full balance to single target", () => {
        const result = distributeFunds(freshSource(), freshTargets(), {
          mode: "even",
          targets: ["target-002"],
        });

        expect(result.sourceBalance).toBe(0);
        expect(result.distributions).toHaveLength(1);
        expect(result.distributions[0].amount).toBe(1000000); // $10,000.00
      });

      it("total distributed should always equal source balance", () => {
        const result = distributeFunds(freshSource(), freshTargets(), {
          mode: "even",
          targets: ["target-001", "target-002", "target-003"],
        });

        const total = result.distributions.reduce((sum, d) => sum + d.amount, 0);
        expect(total).toBe(1000000);
      });

    });

  });

  describe("Custom Mode", () => {

    describe("Validation", () => {

      it("should throw if allocations are empty", () => {
        expect(() =>
          distributeFunds(freshSource(), freshTargets(), {
            mode: "custom",
            allocationsByTargetCents: {},
          })
        ).toThrow("Allocation targets must not be empty");
      });

      it("should throw if invalid account ID provided", () => {
        expect(() =>
          distributeFunds(freshSource(), freshTargets(), {
            mode: "custom",
            allocationsByTargetCents: { "target-999": 100000 } as any,
          })
        ).toThrow('Invalid target account ID: "target-999".');
      });

      it("should throw if amount is zero", () => {
        expect(() =>
          distributeFunds(freshSource(), freshTargets(), {
            mode: "custom",
            allocationsByTargetCents: { "target-001": 0 },
          })
        ).toThrow("Each amount must be greater than zero.");
      });

      it("should throw if amount is negative", () => {
        expect(() =>
          distributeFunds(freshSource(), freshTargets(), {
            mode: "custom",
            allocationsByTargetCents: { "target-001": -50000 },
          })
        ).toThrow("Each amount must be greater than zero.");
      });

      it("should throw if total exceeds source balance", () => {
        expect(() =>
          distributeFunds(freshSource(), freshTargets(), {
            mode: "custom",
            allocationsByTargetCents: {
              "target-001": 600000,
              "target-002": 600000,
            },
          })
        ).toThrow("Sum of amounts cannot exceed source balance.");
      });

    });

    describe("Calculation", () => {

      it("should allocate to 1 target and keep rest in source", () => {
        const result = distributeFunds(freshSource(), freshTargets(), {
          mode: "custom",
          allocationsByTargetCents: { "target-001": 300000 },
        });

        expect(result.sourceBalance).toBe(700000); // $7,000 remaining
        expect(result.distributions).toHaveLength(1);
        expect(result.distributions[0].accountId).toBe("target-001");
        expect(result.distributions[0].amount).toBe(300000);
      });

      it("should allocate to 2 targets and keep rest in source", () => {
        const result = distributeFunds(freshSource(), freshTargets(), {
          mode: "custom",
          allocationsByTargetCents: {
            "target-001": 300000,
            "target-002": 400000,
          },
        });

        expect(result.sourceBalance).toBe(300000); // $3,000 remaining
        expect(result.distributions).toHaveLength(2);
        expect(result.distributions[0].amount).toBe(300000);
        expect(result.distributions[1].amount).toBe(400000);
      });

      it("should allocate to all 3 targets with zero remaining", () => {
        const result = distributeFunds(freshSource(), freshTargets(), {
          mode: "custom",
          allocationsByTargetCents: {
            "target-001": 300000,
            "target-002": 400000,
            "target-003": 300000,
          },
        });

        expect(result.sourceBalance).toBe(0);
        expect(result.distributions).toHaveLength(3);
      });

      it("source balance should reduce by exact allocated amount", () => {
        const result = distributeFunds(freshSource(), freshTargets(), {
          mode: "custom",
          allocationsByTargetCents: { "target-001": 250000 },
        });

        expect(result.sourceBalance).toBe(1000000 - 250000);
      });

    });

  });

});