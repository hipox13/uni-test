"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { getDonorToken } from "@/lib/donor-auth";

const API = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002"}/api/v1`;
const AMOUNTS_MONTHLY = [50_000, 100_000, 250_000, 500_000, 1_000_000, 2_500_000];
const AMOUNTS_ONEOFF = [50_000, 100_000, 250_000, 500_000, 1_000_000, 5_000_000];

const PAYMENT_METHODS = [
  { id: "bca", label: "BCA VA", group: "bank_transfer", icon: "🏦" },
  { id: "bni", label: "BNI VA", group: "bank_transfer", icon: "🏦" },
  { id: "bri", label: "BRI VA", group: "bank_transfer", icon: "🏦" },
  { id: "permata", label: "Permata VA", group: "bank_transfer", icon: "🏦" },
  { id: "gopay", label: "GoPay", group: "gopay", icon: "📱" },
  { id: "shopeepay", label: "ShopeePay", group: "shopeepay", icon: "🛒" },
] as const;

type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

const STATUS_LABELS: Record<number, string> = {
  0: "Init",
  2: "Pending",
  4: "Success",
  5: "Expired",
  6: "Active",
};

interface ChargeResult {
  order_id?: string;
  transaction_status?: string;
  status_code?: string;
  va_numbers?: { bank: string; va_number: string }[];
  permata_va_number?: string;
  actions?: { name: string; url: string }[];
  expiry_time?: string;
  gross_amount?: string;
  payment_type?: string;
  [key: string]: any;
}

interface CampaignInfo {
  id: number;
  title: string | null;
  description: string | null;
  donateType: number | null;
  picture: string | null;
}

function fmt(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

function getVaNumber(res: ChargeResult): string {
  if (res.va_numbers?.[0]) return res.va_numbers[0].va_number;
  if (res.permata_va_number) return res.permata_va_number;
  if (res.bill_key) return `${res.biller_code} / ${res.bill_key}`;
  return "-";
}

function getBankName(res: ChargeResult): string {
  if (res.va_numbers?.[0]) return res.va_numbers[0].bank.toUpperCase();
  if (res.permata_va_number) return "PERMATA";
  if (res.bill_key) return "MANDIRI";
  return res.payment_type?.toUpperCase() ?? "-";
}

export default function DonatePage() {
  const searchParams = useSearchParams();
  const campaignId = searchParams.get("campaign");

  const [campaign, setCampaign] = useState<CampaignInfo | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(250_000);
  const [customAmount, setCustomAmount] = useState("");
  const [isMonthly, setIsMonthly] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<PaymentMethodId>("bca");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chargeResult, setChargeResult] = useState<ChargeResult | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [copied, setCopied] = useState(false);
  const [txRefId, setTxRefId] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) return;
    axios.get(`${API}/donations/${campaignId}`)
      .then(({ data }) => {
        setCampaign(data);
        const dt = data.donateType;
        if (dt === 1) setIsMonthly(true);
        else if (dt === 2) setIsMonthly(false);
      })
      .catch(() => { });
  }, [campaignId]);

  const canMonthly = !campaign?.donateType || campaign.donateType === 1 || campaign.donateType === 3;
  const canOneoff = !campaign?.donateType || campaign.donateType === 2 || campaign.donateType === 3;
  const showFrequencyToggle = canMonthly && canOneoff;

  const finalAmount = selectedAmount || Number(customAmount) || 0;
  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === method)!;
  const isBankTransfer = selectedMethod.group === "bank_transfer";
  const amounts = isMonthly ? AMOUNTS_MONTHLY : AMOUNTS_ONEOFF;

  async function handleSubmit() {
    setError("");
    if (finalAmount < 10_000) {
      setError("Minimum donation is Rp 10.000");
      return;
    }
    if (!firstName.trim() || !email.trim()) {
      setError("Please fill in your name and email");
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        amount: finalAmount,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        paymentMethod: selectedMethod.group,
        donateType: isMonthly ? 1 : 2,
        campaignType: 1,
      };
      if (campaign?.id) body.articleId = campaign.id;
      if (isBankTransfer) body.bankCode = method;

      const token = getDonorToken();
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const { data } = await axios.post(`${API}/payments/charge`, body, { headers });
      const midtransData = data?.midtrans ?? data;
      const refId = data?.transaction?.refId ?? midtransData?.order_id;
      if (refId) {
        midtransData.order_id = midtransData.order_id ?? refId;
        setTxRefId(refId);
      }
      setChargeResult(midtransData);
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? Array.isArray(err.response.data.message)
            ? err.response.data.message.join(", ")
            : err.response.data.message
          : "Payment failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function checkStatus() {
    const orderId = chargeResult?.order_id ?? txRefId;
    if (!orderId) return;
    setCheckingStatus(true);
    try {
      const { data } = await axios.get(`${API}/payments/status/${orderId}`);
      const midtransStatus = data?.midtrans ?? data;
      const txStatus = data?.transaction?.status;

      if (
        midtransStatus?.transaction_status === "settlement" ||
        midtransStatus?.transaction_status === "capture" ||
        txStatus === 4 ||
        txStatus === 6
      ) {
        setChargeResult((prev) => ({
          ...prev,
          ...midtransStatus,
          transaction_status: midtransStatus?.transaction_status ?? "settlement",
        }));
      } else {
        setError(
          "Payment not yet received. Please complete your payment first." +
          (midtransStatus?.transaction_status
            ? ` (Status: ${midtransStatus.transaction_status})`
            : "")
        );
        setTimeout(() => setError(""), 5000);
      }
    } catch {
      setError("Could not check status. Try again shortly.");
      setTimeout(() => setError(""), 4000);
    } finally {
      setCheckingStatus(false);
    }
  }

  const isSettled =
    chargeResult?.transaction_status === "settlement" ||
    chargeResult?.transaction_status === "capture";

  if (isSettled) {
    return (
      <div className="max-w-lg mx-auto px-6 py-24 text-center space-y-6">
        <div className="text-6xl">🎉</div>
        <h1 className="text-3xl font-bold">Thank You!</h1>
        <p className="text-[hsl(var(--muted-foreground))] text-lg">
          Your {isMonthly ? "monthly " : ""}donation of {fmt(finalAmount)} has been received.
          {campaign?.title && <> for <strong>{campaign.title}</strong></>}
        </p>
        {isMonthly && (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Your monthly donation is now active. You&apos;ll be charged {fmt(finalAmount)} each month.
          </p>
        )}
        <button
          onClick={() => {
            setChargeResult(null);
            setTxRefId(null);
            setFirstName("");
            setLastName("");
            setEmail("");
            setPhone("");
          }}
          className="text-[hsl(var(--primary))] font-semibold hover:underline"
        >
          Make another donation
        </button>
      </div>
    );
  }

  if (chargeResult) {
    const ewalletAction = chargeResult.actions?.find(
      (a) =>
        a.name === "deeplink-redirect" ||
        a.name === "generate-qr-code" ||
        a.name === "deeplink_redirect" ||
        a.name === "generate_qr_code",
    );

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 space-y-6 relative">
          <h2 className="text-xl font-bold text-center">Complete Your Payment</h2>

          {campaign?.title && (
            <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
              Campaign: <strong className="text-[hsl(var(--foreground))]">{campaign.title}</strong>
            </p>
          )}

          {isMonthly && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-center">
              <p className="text-xs font-semibold text-blue-700">Monthly Donation — First Payment</p>
              <p className="text-[10px] text-blue-600 mt-0.5">
                After this payment, you&apos;ll be charged {fmt(finalAmount)}/month automatically
              </p>
            </div>
          )}

          {isBankTransfer ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-[hsl(var(--secondary))] rounded-xl p-4">
                <span className="text-2xl">🏦</span>
                <div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Bank</p>
                  <p className="font-bold">{getBankName(chargeResult)}</p>
                </div>
              </div>

              <div className="bg-[hsl(var(--secondary))] rounded-xl p-4 space-y-1">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Virtual Account Number
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold tracking-widest font-mono">
                    {getVaNumber(chargeResult)}
                  </p>
                  <button
                    onClick={() => {
                      copyToClipboard(getVaNumber(chargeResult));
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="text-xs font-semibold text-[hsl(var(--primary))] hover:underline"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[hsl(var(--secondary))] rounded-xl p-4">
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Amount</p>
                  <p className="font-bold text-sm">
                    {fmt(Number(chargeResult.gross_amount) || finalAmount)}
                  </p>
                </div>
                <div className="bg-[hsl(var(--secondary))] rounded-xl p-4">
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Expiry</p>
                  <p className="font-bold text-sm">
                    {chargeResult.expiry_time
                      ? new Date(chargeResult.expiry_time).toLocaleString("id-ID")
                      : "24 hours"}
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-xs text-amber-700">
                  <strong>Sandbox Testing:</strong> Go to{" "}
                  <a
                    href={`https://simulator.sandbox.midtrans.com/${method === "bca" ? "bca" : method === "bni" ? "bni" : method === "bri" ? "bri" : "permata"}/va/index`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-semibold"
                  >
                    Midtrans Simulator
                  </a>{" "}
                  to simulate payment without real money.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <div className="bg-[hsl(var(--secondary))] rounded-xl p-6">
                <span className="text-4xl block mb-3">{selectedMethod.icon}</span>
                <p className="font-bold mb-1">Open your {selectedMethod.label} app</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Complete the payment of {fmt(finalAmount)} in your app
                </p>
              </div>
              {ewalletAction && (
                <a
                  href={ewalletAction.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-[hsl(var(--primary))] text-white px-6 py-3 rounded-full font-semibold hover:brightness-110 transition-all"
                >
                  Open {selectedMethod.label}
                </a>
              )}
            </div>
          )}

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            onClick={checkStatus}
            disabled={checkingStatus}
            className="w-full border-2 border-[hsl(var(--primary))] text-[hsl(var(--primary))] py-3 rounded-full font-semibold hover:bg-[hsl(199,89%,48%,0.05)] transition-all disabled:opacity-50"
          >
            {checkingStatus ? "Checking..." : "I've Completed My Payment"}
          </button>

          <button
            onClick={() => { setChargeResult(null); setTxRefId(null); }}
            className="w-full text-sm text-[hsl(var(--muted-foreground))] hover:underline"
          >
            Cancel &amp; go back
          </button>
        </div>
      </div>
    );
  }

  const inputCls =
    "px-4 py-3.5 rounded-xl border border-[hsl(var(--border))] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] transition-all";

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="text-center max-w-xl mx-auto mb-12 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[hsl(var(--primary))]">
          Make a Difference
        </p>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
          {campaign?.title || "Support Children in Need"}
        </h1>
        <p className="text-[hsl(var(--muted-foreground))] text-lg leading-relaxed">
          {campaign?.description || "Your donation helps provide education, clean water, and healthcare."}
        </p>
      </div>

      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-3 space-y-8">
          {/* Frequency toggle - only show if campaign supports both */}
          {showFrequencyToggle ? (
            <div className="flex bg-[hsl(var(--secondary))] rounded-full p-1 max-w-xs">
              {[false, true].map((monthly) => (
                <button
                  key={String(monthly)}
                  onClick={() => { setIsMonthly(monthly); setSelectedAmount(monthly ? 100_000 : 250_000); }}
                  className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${isMonthly === monthly
                    ? "bg-white text-[hsl(var(--foreground))] shadow-sm"
                    : "text-[hsl(var(--muted-foreground))]"
                    }`}
                >
                  {monthly ? "Monthly" : "One-time"}
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-[hsl(var(--secondary))] rounded-xl px-5 py-3 inline-block">
              <span className="text-sm font-semibold">
                {isMonthly ? "Monthly Donation" : "One-time Donation"}
              </span>
            </div>
          )}

          {/* Amount Grid */}
          <div>
            <p className="text-sm font-semibold mb-4">Select Amount</p>
            <div className="grid grid-cols-3 gap-3">
              {amounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => { setSelectedAmount(amount); setCustomAmount(""); }}
                  className={`py-4 rounded-xl text-sm font-semibold transition-all border ${selectedAmount === amount
                    ? "border-[hsl(var(--primary))] bg-[hsl(199,89%,48%,0.05)] text-[hsl(var(--primary))]"
                    : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/40"
                    }`}
                >
                  {fmt(amount)}
                  {isMonthly && <span className="block text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">/month</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div>
            <p className="text-sm font-semibold mb-3">Or enter custom amount</p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[hsl(var(--muted-foreground))] font-medium">
                Rp
              </span>
              <input
                type="number"
                placeholder="0"
                value={customAmount}
                onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                className="w-full pl-10 pr-4 py-4 rounded-xl border border-[hsl(var(--border))] bg-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] transition-all"
                min={10000}
              />
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1.5">Minimum Rp 10.000</p>

            {/* Threshold Badges */}
            <div className="mt-6 flex flex-wrap gap-3">
              {isMonthly && finalAmount >= 150_000 && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
                  <span className="text-xl">🏆</span>
                  <div>
                    <p className="text-xs font-bold leading-none">Pendekar Anak Eligible</p>
                    <p className="text-[10px] opacity-80 mt-1">You will receive the "Gelar Pendekar Anak"</p>
                  </div>
                </div>
              )}
              {!isMonthly && finalAmount >= 300_000 && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
                  <span className="text-xl">📜</span>
                  <div>
                    <p className="text-xs font-bold leading-none">E-Certificate Eligible</p>
                    <p className="text-[10px] opacity-80 mt-1">You will receive a UNICEF E-Certificate</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Donor Info */}
          <div className="space-y-4">
            <p className="text-sm font-semibold">Your Information</p>
            <div className="grid md:grid-cols-2 gap-4">
              <input type="text" placeholder="First Name *" value={firstName}
                onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
              <input type="text" placeholder="Last Name" value={lastName}
                onChange={(e) => setLastName(e.target.value)} className={inputCls} />
            </div>
            <input type="email" placeholder="Email Address *" value={email}
              onChange={(e) => setEmail(e.target.value)} className={`w-full ${inputCls}`} />
            <input type="tel" placeholder="Phone Number" value={phone}
              onChange={(e) => setPhone(e.target.value)} className={`w-full ${inputCls}`} />
          </div>

          {/* Payment Method */}
          <div>
            <p className="text-sm font-semibold mb-4">Payment Method</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setMethod(pm.id)}
                  className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${method === pm.id
                    ? "border-[hsl(var(--primary))] bg-[hsl(199,89%,48%,0.05)] ring-1 ring-[hsl(var(--primary))]"
                    : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/40"
                    }`}
                >
                  <span className="text-xl">{pm.icon}</span>
                  <span className="text-sm font-semibold">{pm.label}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm font-medium bg-red-50 px-4 py-3 rounded-xl">
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={finalAmount < 10_000 || loading}
            className="w-full bg-[hsl(var(--primary))] text-white py-4 rounded-full text-lg font-semibold hover:brightness-110 transition-all shadow-xl shadow-[hsl(199,89%,48%,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </>
            ) : finalAmount >= 10_000 ? (
              `Donate ${fmt(finalAmount)}${isMonthly ? " / month" : ""}`
            ) : (
              "Select an amount"
            )}
          </button>
        </div>

        {/* Sidebar */}
        <div className="md:col-span-2 space-y-6">
          {campaign && (
            <div className="rounded-2xl border border-[hsl(var(--primary))]/20 bg-[hsl(199,89%,48%,0.03)] p-6 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--primary))]">Campaign</p>
              <h3 className="font-bold text-sm">{campaign.title}</h3>
              {campaign.description && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-3">{campaign.description}</p>
              )}
            </div>
          )}

          {isMonthly && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 space-y-3">
              <h3 className="font-bold text-blue-800 text-sm">Monthly Donation</h3>
              <ul className="space-y-2 text-xs text-blue-700">
                <li className="flex gap-2"><span>📅</span> Charged monthly on the same date</li>
                <li className="flex gap-2"><span>🔄</span> Cancel anytime from your donor portal</li>
                <li className="flex gap-2"><span>💳</span> New VA generated each month</li>
              </ul>
            </div>
          )}

          <div className="rounded-2xl border border-[hsl(var(--border))] p-6 bg-[hsl(var(--secondary))] space-y-5">
            <h3 className="font-bold">Your Impact</h3>
            {finalAmount >= 50_000 ? (
              <div className="space-y-4">
                {finalAmount >= 50_000 && (
                  <div className="flex gap-3">
                    <span className="text-2xl">�</span>
                    <div>
                      <p className="text-sm font-semibold">Clean Water</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        Provides clean water for {Math.floor(finalAmount / 50_000)} families{isMonthly ? "/month" : ""}
                      </p>
                    </div>
                  </div>
                )}
                {finalAmount >= 100_000 && (
                  <div className="flex gap-3">
                    <span className="text-2xl">📚</span>
                    <div>
                      <p className="text-sm font-semibold">Education</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        Supplies for {Math.floor(finalAmount / 100_000)} students{isMonthly ? "/month" : ""}
                      </p>
                    </div>
                  </div>
                )}
                {finalAmount >= 250_000 && (
                  <div className="flex gap-3">
                    <span className="text-2xl">�</span>
                    <div>
                      <p className="text-sm font-semibold">Healthcare</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        Vaccinations for {Math.floor(finalAmount / 25_000)} children{isMonthly ? "/month" : ""}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Select an amount to see what your donation can do.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-[hsl(var(--border))] p-6 space-y-4">
            <h3 className="font-bold text-sm">Why Donate to UNICEF?</h3>
            <ul className="space-y-3">
              {[
                "99% of donations go directly to programs",
                "Tax-deductible in Indonesia",
                "Transparent spending reports",
                "Secure & encrypted payment",
              ].map((point) => (
                <li key={point} className="flex gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                  <span className="text-[hsl(var(--primary))] font-bold">✓</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
