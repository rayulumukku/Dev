export const PROFILES = {
  small: { componentsCount: 50, routesCount: 10, assetsCount: 25 },
  medium: { componentsCount: 300, routesCount: 50, assetsCount: 100 },
  large: { componentsCount: 1000, routesCount: 150, assetsCount: 300 },
  huge: { componentsCount: 5000, routesCount: 500, assetsCount: 1000 },
};

export class SeededPRNG {
  constructor(seed = 42) {
    this.state = seed % 2147483647;
    if (this.state <= 0) this.state += 2147483646;
  }

  nextFloat() {
    this.state = (this.state * 16807) % 2147483647;
    return (this.state - 1) / 2147483646;
  }

  nextInt(min, max) {
    return Math.floor(this.nextFloat() * (max - min + 1)) + min;
  }
}
