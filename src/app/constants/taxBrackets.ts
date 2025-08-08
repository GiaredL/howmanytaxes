export const taxBrackets2024 = {
  single: [
    { rate: 0.1, min: 0, max: 11600 },
    { rate: 0.12, min: 11601, max: 47150 },
    { rate: 0.22, min: 47151, max: 100525 },
    { rate: 0.24, min: 100526, max: 191950 },
    { rate: 0.32, min: 191951, max: 243725 },
    { rate: 0.35, min: 243726, max: 609350 },
    { rate: 0.37, min: 609351, max: null }
  ],
  marriedJoint: [
    { rate: 0.1, min: 0, max: 23200 },
    { rate: 0.12, min: 23201, max: 94300 },
    { rate: 0.22, min: 94301, max: 201050 },
    { rate: 0.24, min: 201051, max: 383900 },
    { rate: 0.32, min: 383901, max: 487450 },
    { rate: 0.35, min: 487451, max: 731200 },
    { rate: 0.37, min: 731201, max: null }
  ],
  marriedSeparate: [
    { rate: 0.1, min: 0, max: 11600 },
    { rate: 0.12, min: 11601, max: 47150 },
    { rate: 0.22, min: 47151, max: 100525 },
    { rate: 0.24, min: 100526, max: 191950 },
    { rate: 0.32, min: 191951, max: 243725 },
    { rate: 0.35, min: 243726, max: 365600 },
    { rate: 0.37, min: 365601, max: null }
  ],
  headOfHousehold: [
    { rate: 0.1, min: 0, max: 17000 },
    { rate: 0.12, min: 17000, max: 64850 },
    { rate: 0.22, min: 64850, max: 103350 },
    { rate: 0.24, min: 103350, max: 197300 },
    { rate: 0.32, min: 197300, max: 250500 },
    { rate: 0.35, min: 250500, max: 626350 },
    { rate: 0.37, min: 626350, max: null }
  ]
}
