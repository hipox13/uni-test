import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MidtransChargeParams {
  order_id: string;
  gross_amount: number;
  payment_type: string;
  bank?: string;
  customer_details?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  custom_expiry?: {
    expiry_duration: number;
    unit: 'second' | 'minute' | 'hour' | 'day';
  };
  item_details?: { id: string; price: number; quantity: number; name: string }[];
  gopay?: {
    enable_callback?: boolean;
    callback_url?: string;
    recurring?: boolean;
    account_id?: string;
  };
}

export interface MidtransSubscriptionParams {
  name: string;
  amount: string;
  currency: string;
  payment_type: string;
  token?: string;
  schedule: {
    interval: number;
    interval_unit: string;
    max_interval?: number;
    start_time?: string;
  };
  retry_schedule?: {
    interval: number;
    interval_unit: string;
    max_interval: number;
  };
  gopay?: {
    account_id: string;
    enable_callback?: boolean;
    callback_url?: string;
    recurring?: boolean;
  };
  metadata?: Record<string, string>;
  customer_details?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
}

@Injectable()
export class MidtransService {
  private readonly logger = new Logger(MidtransService.name);
  private readonly serverKey: string;
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.serverKey = this.config.get<string>('MIDTRANS_SERVER_KEY', '');
    const isProd = this.config.get<string>('MIDTRANS_IS_PRODUCTION', 'false') === 'true';
    this.baseUrl = isProd
      ? 'https://api.midtrans.com'
      : 'https://api.sandbox.midtrans.com';
  }

  get isProduction(): boolean {
    return this.config.get<string>('MIDTRANS_IS_PRODUCTION', 'false') === 'true';
  }

  private get authHeader(): string {
    return 'Basic ' + Buffer.from(this.serverKey + ':').toString('base64');
  }

  private async request<T = any>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: this.authHeader,
      },
    };
    if (body) options.body = JSON.stringify(body);

    this.logger.debug(`${method} ${url}`);
    const res = await fetch(url, options);
    const data = await res.json() as T;
    if (!res.ok) {
      this.logger.error(`Midtrans error: ${JSON.stringify(data)}`);
    }
    return data;
  }

  async createCharge(params: MidtransChargeParams) {
    const payload = this.buildChargePayload(params);
    return this.request<any>('POST', '/v2/charge', payload);
  }

  async getStatus(orderId: string) {
    return this.request<any>('GET', `/v2/${orderId}/status`);
  }

  async cancelTransaction(orderId: string) {
    return this.request<any>('POST', `/v2/${orderId}/cancel`);
  }

  async refundTransaction(orderId: string, amount: number, reason: string) {
    return this.request<any>('POST', `/v2/${orderId}/refund`, {
      amount,
      reason,
    });
  }

  async createSubscription(params: MidtransSubscriptionParams) {
    return this.request<any>('POST', '/v1/subscriptions', params);
  }

  async getSubscription(subscriptionId: string) {
    return this.request<any>('GET', `/v1/subscriptions/${subscriptionId}`);
  }

  async disableSubscription(subscriptionId: string) {
    return this.request<any>('POST', `/v1/subscriptions/${subscriptionId}/disable`);
  }

  async enableSubscription(subscriptionId: string) {
    return this.request<any>('POST', `/v1/subscriptions/${subscriptionId}/enable`);
  }

  /** GoPay account linking: POST /v2/pay/account */
  async linkGopayAccount(phoneNumber: string, redirectUrl: string) {
    return this.request<any>('POST', '/v2/pay/account', {
      payment_type: 'gopay',
      gopay_partner: {
        phone_number: phoneNumber,
        country_code: '62',
        redirect_url: redirectUrl,
      },
    });
  }

  /** Get GoPay account status */
  async getGopayAccountStatus(accountId: string) {
    return this.request<any>('GET', `/v2/pay/account/${accountId}`);
  }

  private buildChargePayload(params: MidtransChargeParams) {
    const base: Record<string, any> = {
      payment_type: params.payment_type,
      transaction_details: {
        order_id: params.order_id,
        gross_amount: params.gross_amount,
      },
      customer_details: params.customer_details,
    };

    if (params.item_details?.length) {
      base.item_details = params.item_details;
    }

    if (params.custom_expiry) {
      base.custom_expiry = params.custom_expiry;
    }

    if (params.payment_type === 'bank_transfer') {
      const bankConfig: Record<string, any> = { bank: params.bank ?? 'bca' };
      base.bank_transfer = bankConfig;

      if (params.bank === 'permata') {
        delete base.bank_transfer;
        base.payment_type = 'permata';
      }
    }

    if (params.payment_type === 'gopay') {
      base.gopay = {
        enable_callback: true,
        callback_url: params.gopay?.callback_url ?? '',
        ...(params.gopay?.account_id && { account_id: params.gopay.account_id }),
        ...(params.gopay?.recurring !== undefined && { recurring: params.gopay.recurring }),
      };
    }

    if (params.payment_type === 'shopeepay') {
      base.shopeepay = { callback_url: '' };
    }

    if (params.payment_type === 'credit_card') {
      base.credit_card = { secure: true };
    }

    return base;
  }
}
