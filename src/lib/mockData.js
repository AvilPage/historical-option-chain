// Mock option chain data
export const mockOptionChainData = {
  symbol: "NIFTY",
  currentPrice: 26328.55,
  change: 0.70,
  changePercent: 0.70,
  synthFutPrice: 26346.52,
  expiry: "2026-01-06",
  lastUpdated: "2026-01-03 15:30:00",
  
  strikes: [
    {
      strike: 25000,
      call: { ltp: 1348.70, change: 15, oi: 2145000, iv: 21.1, delta: 0.98, gamma: 0.001, theta: -2.5, vega: 5.2 },
      put: { ltp: 1.65, change: -6, oi: 3256000, iv: 21.1, delta: -0.02, gamma: 0.001, theta: -0.5, vega: 1.2 }
    },
    {
      strike: 25200,
      call: { ltp: 1142.00, change: 18, oi: 1856000, iv: 18.3, delta: 0.96, gamma: 0.002, theta: -2.8, vega: 6.1 },
      put: { ltp: 1.70, change: -15, oi: 2890000, iv: 18.3, delta: -0.04, gamma: 0.002, theta: -0.6, vega: 1.5 }
    },
    {
      strike: 25400,
      call: { ltp: 946.45, change: 23, oi: 2234000, iv: 15.9, delta: 0.93, gamma: 0.003, theta: -3.2, vega: 7.3 },
      put: { ltp: 2.15, change: -16, oi: 3120000, iv: 15.9, delta: -0.07, gamma: 0.003, theta: -0.8, vega: 2.1 }
    },
    {
      strike: 25600,
      call: { ltp: 760.60, change: 33, oi: 1967000, iv: 13.3, delta: 0.89, gamma: 0.004, theta: -3.8, vega: 8.5 },
      put: { ltp: 2.60, change: -15, oi: 2756000, iv: 13.3, delta: -0.11, gamma: 0.004, theta: -1.1, vega: 2.8 }
    },
    {
      strike: 25800,
      call: { ltp: 550.00, change: 47, oi: 3456000, iv: 10.7, delta: 0.84, gamma: 0.006, theta: -4.5, vega: 10.2 },
      put: { ltp: 3.50, change: -47, oi: 4123000, iv: 10.7, delta: -0.16, gamma: 0.006, theta: -1.5, vega: 3.8 }
    },
    {
      strike: 26000,
      call: { ltp: 353.00, change: 80, oi: 5234000, iv: 8.5, delta: 0.76, gamma: 0.009, theta: -5.8, vega: 12.8 },
      put: { ltp: 7.05, change: -73, oi: 6890000, iv: 8.5, delta: -0.24, gamma: 0.009, theta: -2.3, vega: 5.5 }
    },
    {
      strike: 26100,
      call: { ltp: 257.85, change: 113, oi: 4567000, iv: 7.5, delta: 0.69, gamma: 0.012, theta: -7.2, vega: 15.3 },
      put: { ltp: 11.65, change: -77, oi: 8234000, iv: 7.5, delta: -0.31, gamma: 0.012, theta: -3.1, vega: 7.2 }
    },
    {
      strike: 26200,
      call: { ltp: 169.30, change: 164, oi: 6123000, iv: 6.8, delta: 0.61, gamma: 0.015, theta: -9.5, vega: 18.6 },
      put: { ltp: 23.00, change: -76, oi: 9876000, iv: 6.8, delta: -0.39, gamma: 0.015, theta: -4.8, vega: 10.1 }
    },
    {
      strike: 26250,
      call: { ltp: 129.20, change: 201, oi: 5678000, iv: 6.5, delta: 0.55, gamma: 0.017, theta: -11.2, vega: 21.5 },
      put: { ltp: 33.30, change: -73, oi: 11234000, iv: 6.5, delta: -0.45, gamma: 0.017, theta: -6.2, vega: 13.8 }
    },
    {
      strike: 26300,
      call: { ltp: 94.00, change: 243, oi: 7890000, iv: 6.2, delta: 0.48, gamma: 0.019, theta: -13.8, vega: 25.3 },
      put: { ltp: 47.70, change: -70, oi: 12456000, iv: 6.2, delta: -0.52, gamma: 0.019, theta: -8.5, vega: 18.2 }
    },
    {
      strike: 26350,
      call: { ltp: 65.00, change: 295, oi: 8234000, iv: 6.1, delta: 0.41, gamma: 0.020, theta: -16.5, vega: 28.9 },
      put: { ltp: 68.40, change: -65, oi: 13567000, iv: 6.1, delta: -0.59, gamma: 0.020, theta: -11.2, vega: 22.8 }
    },
    {
      strike: 26400,
      call: { ltp: 42.60, change: 346, oi: 9567000, iv: 6.0, delta: 0.34, gamma: 0.021, theta: -19.8, vega: 32.1 },
      put: { ltp: 96.00, change: -60, oi: 14890000, iv: 6.0, delta: -0.66, gamma: 0.021, theta: -14.5, vega: 27.6 }
    },
    {
      strike: 26450,
      call: { ltp: 26.50, change: 361, oi: 8923000, iv: 6.0, delta: 0.27, gamma: 0.021, theta: -22.5, vega: 34.8 },
      put: { ltp: 129.05, change: -55, oi: 15234000, iv: 6.0, delta: -0.73, gamma: 0.021, theta: -18.2, vega: 32.1 }
    },
    {
      strike: 26500,
      call: { ltp: 15.80, change: 316, oi: 11234000, iv: 6.0, delta: 0.21, gamma: 0.020, theta: -24.8, vega: 36.5 },
      put: { ltp: 169.55, change: -49, oi: 16789000, iv: 6.0, delta: -0.79, gamma: 0.020, theta: -21.8, vega: 36.2 }
    },
    {
      strike: 26550,
      call: { ltp: 9.30, change: 232, oi: 9876000, iv: 6.1, delta: 0.16, gamma: 0.019, theta: -26.2, vega: 37.1 },
      put: { ltp: 212.55, change: -45, oi: 17234000, iv: 6.1, delta: -0.84, gamma: 0.019, theta: -24.5, vega: 39.8 }
    },
    {
      strike: 26600,
      call: { ltp: 5.65, change: 157, oi: 8456000, iv: 6.3, delta: 0.12, gamma: 0.017, theta: -27.1, vega: 36.8 },
      put: { ltp: 256.95, change: -41, oi: 18567000, iv: 6.3, delta: -0.88, gamma: 0.017, theta: -26.8, vega: 42.5 }
    },
    {
      strike: 26700,
      call: { ltp: 2.35, change: 52, oi: 7123000, iv: 6.9, delta: 0.07, gamma: 0.013, theta: -27.8, vega: 34.2 },
      put: { ltp: 355.00, change: -33, oi: 19234000, iv: 6.9, delta: -0.93, gamma: 0.013, theta: -28.5, vega: 45.8 }
    },
    {
      strike: 26800,
      call: { ltp: 1.50, change: 20, oi: 6234000, iv: 7.8, delta: 0.04, gamma: 0.009, theta: -27.2, vega: 30.5 },
      put: { ltp: 452.75, change: -28, oi: 20123000, iv: 7.8, delta: -0.96, gamma: 0.009, theta: -29.8, vega: 48.2 }
    },
    {
      strike: 26900,
      call: { ltp: 0.95, change: -5, oi: 5456000, iv: 8.7, delta: 0.03, gamma: 0.006, theta: -25.8, vega: 26.1 },
      put: { ltp: 557.05, change: -24, oi: 21890000, iv: 8.7, delta: -0.97, gamma: 0.006, theta: -30.5, vega: 50.8 }
    },
    {
      strike: 27000,
      call: { ltp: 0.80, change: -20, oi: 4789000, iv: 9.8, delta: 0.02, gamma: 0.004, theta: -23.5, vega: 21.8 },
      put: { ltp: 662.60, change: -20, oi: 22456000, iv: 9.8, delta: -0.98, gamma: 0.004, theta: -31.2, vega: 53.5 }
    },
    {
      strike: 27200,
      call: { ltp: 0.65, change: -13, oi: 3890000, iv: 12.1, delta: 0.01, gamma: 0.002, theta: -18.5, vega: 15.2 },
      put: { ltp: 868.75, change: -14, oi: 23123000, iv: 12.1, delta: -0.99, gamma: 0.002, theta: -32.8, vega: 58.5 }
    }
  ]
};

export const symbols = [
  { value: "NIFTY", label: "NIFTY" },
  { value: "BANKNIFTY", label: "BANKNIFTY" },
  { value: "FINNIFTY", label: "FINNIFTY" },
  { value: "RELIANCE", label: "RELIANCE" },
  { value: "TCS", label: "TCS" },
  { value: "INFY", label: "INFY" },
  { value: "HDFCBANK", label: "HDFCBANK" },
  { value: "ICICIBANK", label: "ICICIBANK" },
];

export const expiryDates = [
  "2026-01-06",
  "2026-01-13",
  "2026-01-20",
  "2026-01-27",
  "2026-02-03",
  "2026-02-10"
];
