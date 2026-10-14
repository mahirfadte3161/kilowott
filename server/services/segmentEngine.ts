import { query, get } from '../database/db.ts';
import { Customer, Segment } from '../types/index.ts';

export class SegmentEngine {
  /**
   * Retrieves all customers belonging to a specific segment rule.
   */
  public static getSegmentCustomers(segmentId: string): Customer[] {
    const seg = get<Segment>('SELECT * FROM segments WHERE id = ?', [segmentId]);
    if (!seg) return [];

    let config: any = {};
    try {
      config = JSON.parse(seg.rule_config_json || '{}');
    } catch {
      config = {};
    }

    const now = new Date();
    const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

    switch (seg.rule_type) {
      case 'high_value': {
        const minSpend = Number(config.min_spend ?? 500);
        return query<Customer>(`
          SELECT c.* FROM customers c
          WHERE c.lifetime_spend >= ?
          ORDER BY c.lifetime_spend DESC
        `, [minSpend]);
      }

      case 'repeat': {
        const minOrders = Number(config.min_orders ?? 2);
        return query<Customer>(`
          SELECT c.* FROM customers c
          WHERE c.total_orders >= ?
          ORDER BY c.total_orders DESC
        `, [minOrders]);
      }

      case 'inactive_60': {
        const cutoff = daysAgo(60);
        return query<Customer>(`
          SELECT c.* FROM customers c
          WHERE (c.last_order_at IS NOT NULL AND c.last_order_at < ?)
             OR (c.last_order_at IS NULL AND c.registered_at < ?)
          ORDER BY c.last_order_at ASC
        `, [cutoff, cutoff]);
      }

      case 'inactive_90': {
        const cutoff = daysAgo(90);
        return query<Customer>(`
          SELECT c.* FROM customers c
          WHERE (c.last_order_at IS NOT NULL AND c.last_order_at < ?)
             OR (c.last_order_at IS NULL AND c.registered_at < ?)
          ORDER BY c.last_order_at ASC
        `, [cutoff, cutoff]);
      }

      case 'recent': {
        const days = Number(config.days ?? 30);
        const cutoff = daysAgo(days);
        return query<Customer>(`
          SELECT c.* FROM customers c
          WHERE c.last_order_at >= ?
          ORDER BY c.last_order_at DESC
        `, [cutoff]);
      }

      case 'pending_orders': {
        return query<Customer>(`
          SELECT DISTINCT c.* FROM customers c
          JOIN orders o ON o.customer_id = c.id
          WHERE o.status IN ('pending', 'on-hold')
          ORDER BY c.first_name ASC
        `);
      }

      case 'custom': {
        const minSpend = Number(config.min_spend ?? 0);
        const minOrders = Number(config.min_orders ?? 0);
        return query<Customer>(`
          SELECT c.* FROM customers c
          WHERE c.lifetime_spend >= ? AND c.total_orders >= ?
          ORDER BY c.lifetime_spend DESC
        `, [minSpend, minOrders]);
      }

      default:
        return query<Customer>('SELECT * FROM customers ORDER BY created_at DESC');
    }
  }

  /**
   * Computes counts and summary metrics for all segments.
   */
  public static getAllSegmentsWithCounts(): (Segment & { member_count: number })[] {
    const segments = query<Segment>('SELECT * FROM segments ORDER BY name ASC');
    return segments.map(s => {
      const members = this.getSegmentCustomers(s.id);
      return {
        ...s,
        member_count: members.length,
      };
    });
  }

  /**
   * Generates analytical CRM insights based on real database records.
   */
  public static generateInsights() {
    const totalCustomersRow = get<{ c: number }>('SELECT COUNT(*) as c FROM customers');
    const totalOrdersRow = get<{ c: number }>('SELECT COUNT(*) as c FROM orders WHERE status NOT IN (\'cancelled\', \'refunded\')');
    const totalRevRow = get<{ s: number }>('SELECT SUM(total) as s FROM orders WHERE status NOT IN (\'cancelled\', \'refunded\')');

    const totalCustomers = totalCustomersRow?.c || 0;
    const totalOrders = totalOrdersRow?.c || 0;
    const totalRevenue = totalRevRow?.s || 0;

    if (totalCustomers === 0 || totalOrders === 0) {
      return {
        hasData: false,
        message: 'Insufficient historical data to compute customer behavioral insights.',
        insights: [],
      };
    }

    const highValueCount = this.getSegmentCustomers(
      query<Segment>('SELECT id FROM segments WHERE rule_type = \'high_value\'')[0]?.id || ''
    ).length;

    const inactive60Count = this.getSegmentCustomers(
      query<Segment>('SELECT id FROM segments WHERE rule_type = \'inactive_60\'')[0]?.id || ''
    ).length;

    const repeatBuyersCount = this.getSegmentCustomers(
      query<Segment>('SELECT id FROM segments WHERE rule_type = \'repeat\'')[0]?.id || ''
    ).length;

    const repeatRatio = Math.round((repeatBuyersCount / totalCustomers) * 100);
    const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0';

    const insights = [
      {
        id: 'repeat_ratio',
        type: 'retention',
        title: 'High Customer Loyalty',
        description: `${repeatRatio}% of your active customer base has placed 2 or more orders. Repeat customers generate higher lifetime value.`,
        metric: `${repeatRatio}% repeat rate`,
        recommendation: 'Target with loyalty rewards or early access campaigns.',
      },
      {
        id: 'inactive_reengage',
        type: 'churn_risk',
        title: 'Win-Back Opportunity',
        description: `${inactive60Count} customers have not made a purchase in over 60 days.`,
        metric: `${inactive60Count} at risk`,
        recommendation: 'Launch the automated "Win-Back Re-Engagement" campaign with a tailored incentive.',
      },
      {
        id: 'high_value_cohort',
        type: 'revenue',
        title: 'High-Value Patrons',
        description: `${highValueCount} premium customers have exceeded $500 in lifetime spending.`,
        metric: `${highValueCount} VIP customers`,
        recommendation: 'Offer dedicated VIP concierge support and bespoke product recommendations.',
      },
      {
        id: 'aov_trend',
        type: 'efficiency',
        title: 'Average Order Performance',
        description: `Average order value currently stands at $${avgOrderValue}.`,
        metric: `$${avgOrderValue} AOV`,
        recommendation: 'Bundle popular accessories to drive cross-sell basket sizes above $250.',
      },
    ];

    return {
      hasData: true,
      insights,
    };
  }
}
