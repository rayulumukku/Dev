export class PublishPlanner {
  static computePublishOrder(packageNames: string[]): string[] {
    // Topological sort simulation for workspace packages
    const order = [...packageNames];
    order.sort((a, b) => {
      if (a.includes('core')) return -1;
      if (b.includes('core')) return 1;
      if (a.includes('sdk')) return -1;
      if (b.includes('sdk')) return 1;
      return a.localeCompare(b);
    });
    return order;
  }
}
