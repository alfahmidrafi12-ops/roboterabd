import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  CheckCircle2,
  Clock,
  Coins,
  Cpu,
  History,
  RefreshCw,
  RotateCcw,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  calculateRewardValueBdt,
  ensureCustomerRewardBalance,
  getRewardTierName,
  MIN_ORDER_FOR_REWARD_BDT,
  MIN_REWARD_REDEEM_POINTS,
  REWARD_BDT_PER_100_POINTS,
  REWARD_POINTS_PER_1000_BDT,
  subscribeCustomerRewardBalance,
  subscribeCustomerRewardTransactions,
} from '../lib/firebase';
import { playTapSound } from '../lib/sound';
import {
  CustomerRewardBalance,
  RewardTransaction,
  RewardTransactionStatus,
  RewardTransactionType,
} from '../types/store';

interface RewardDashboardProps {
  user: User;
}

const LOYALTY_TIERS = [
  { name: 'Circuit Starter', minPoints: 0 },
  { name: 'Lab Builder', minPoints: 1000 },
  { name: 'Robotics Pro', minPoints: 5000 },
  { name: 'Autonomous Pioneer', minPoints: 10000 },
] as const;

const TX_TYPE_LABELS: Record<RewardTransactionType, string> = {
  earned: 'Order Reward',
  redeemed: 'Checkout Redemption',
  welcome_bonus: 'Welcome Bonus',
  first_order_bonus: 'First Order Bonus',
  referral_bonus: 'Referral Bonus',
  campaign_bonus: 'Campaign Bonus',
  birthday_bonus: 'Birthday Bonus',
  manual_add: 'Admin Bonus',
  manual_deduct: 'Admin Adjustment',
  expired: 'Points Expired',
  reversed: 'Order Reversal',
};

const STATUS_BADGE_CONFIG: Record<
  RewardTransactionStatus,
  { cls: string; icon: React.ComponentType<{ className?: string }> }
> = {
  Earned: {
    cls: 'bg-teal-50 text-[#0F766E] border-teal-200',
    icon: CheckCircle2,
  },
  Pending: {
    cls: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: Clock,
  },
  Redeemed: {
    cls: 'bg-blue-50 text-[#0866F5] border-blue-200',
    icon: ArrowUpRight,
  },
  Expired: {
    cls: 'bg-slate-100 text-slate-600 border-slate-300',
    icon: History,
  },
  Reversed: {
    cls: 'bg-red-50 text-red-700 border-red-200',
    icon: RotateCcw,
  },
};

function formatTxDate(ts: unknown): string {
  if (!ts) return 'Just now';
  if (typeof ts === 'object' && ts !== null) {
    if ('toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
      return (ts as { toDate: () => Date }).toDate().toLocaleString('en-BD', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    }
    if ('seconds' in ts && typeof (ts as { seconds: number }).seconds === 'number') {
      return new Date((ts as { seconds: number }).seconds * 1000).toLocaleString('en-BD', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    }
  }
  return 'Recent';
}

export const RewardDashboard: React.FC<RewardDashboardProps> = ({ user }) => {
  const [balance, setBalance] = useState<CustomerRewardBalance | null>(null);
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [txFilter, setTxFilter] = useState<'all' | RewardTransactionStatus>('all');

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    setLoading(true);
    setError('');

    ensureCustomerRewardBalance(user.uid).catch(() => {
      // Safe fallback; listeners still mount cleanly
    });

    let balLoaded = false;
    let txLoaded = false;

    const markReady = () => {
      if (active && balLoaded && txLoaded) {
        setLoading(false);
      }
    };

    const unsubBal = subscribeCustomerRewardBalance(
      user.uid,
      (bal) => {
        if (!active) return;
        setBalance(bal);
        balLoaded = true;
        markReady();
      },
      (err) => {
        if (!active) return;
        console.error('Reward balance subscription failed:', err);
        setError('Unable to load your reward balance right now.');
        setLoading(false);
      }
    );

    const unsubTx = subscribeCustomerRewardTransactions(
      user.uid,
      (txs) => {
        if (!active) return;
        setTransactions(txs);
        txLoaded = true;
        markReady();
      },
      (err) => {
        if (!active) return;
        console.error('Reward transactions subscription failed:', err);
        txLoaded = true;
        markReady();
      }
    );

    return () => {
      active = false;
      unsubBal();
      unsubTx();
    };
  }, [user?.uid, reloadKey]);

  const availablePoints = Math.max(0, balance?.availablePoints ?? 0);
  const pendingPoints = Math.max(0, balance?.pendingPoints ?? 0);
  const lifetimeEarned = Math.max(0, balance?.lifetimeEarned ?? 0);
  const lifetimeRedeemed = Math.max(0, balance?.lifetimeRedeemed ?? 0);

  const bdtValue = calculateRewardValueBdt(availablePoints);
  const formattedBdtValue = bdtValue.toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // 100-point (৳8) checkout reward cycle tracker
  const cycleSize = MIN_REWARD_REDEEM_POINTS;
  const currentCyclePoints =
    availablePoints > 0 && availablePoints % cycleSize === 0
      ? cycleSize
      : availablePoints % cycleSize;
  const cyclePct = Math.min(100, Math.round((currentCyclePoints / cycleSize) * 100));
  const pointsNeededForNextReward =
    availablePoints > 0 && availablePoints % cycleSize === 0
      ? 0
      : cycleSize - (availablePoints % cycleSize);
  const unlockedRewardBlocks = Math.floor(availablePoints / cycleSize);

  // Loyalty Tier calculation
  const currentTierName = balance?.tierName || getRewardTierName(lifetimeEarned);
  const currentTierIdx = Math.max(
    0,
    LOYALTY_TIERS.findIndex((t) => t.name === currentTierName)
  );
  const currentTier = LOYALTY_TIERS[currentTierIdx] ?? LOYALTY_TIERS[0];
  const nextTier = LOYALTY_TIERS[currentTierIdx + 1] ?? null;

  const tierProgressPct = nextTier
    ? Math.min(
        100,
        Math.max(
          0,
          Math.round(
            ((lifetimeEarned - currentTier.minPoints) /
              (nextTier.minPoints - currentTier.minPoints)) *
              100
          )
        )
      )
    : 100;
  const pointsToNextTier = nextTier ? Math.max(0, nextTier.minPoints - lifetimeEarned) : 0;

  const filteredTransactions =
    txFilter === 'all' ? transactions : transactions.filter((t) => t.status === txFilter);

  if (loading) {
    return (
      <div className="space-y-4 animate-tab-enter" aria-busy="true">
        <div className="h-44 rounded-2xl bg-[#071A3B]/90 animate-pulse p-5 flex flex-col justify-between">
          <div className="h-4 w-36 rounded bg-white/15" />
          <div className="h-9 w-48 rounded bg-white/20" />
          <div className="grid grid-cols-3 gap-2">
            <div className="h-10 rounded-xl bg-white/10" />
            <div className="h-10 rounded-xl bg-white/10" />
            <div className="h-10 rounded-xl bg-white/10" />
          </div>
        </div>
        <div className="h-28 rounded-2xl bg-[#EDF2F8] animate-pulse" />
        <div className="h-32 rounded-2xl bg-[#EDF2F8] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-tab-enter">
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              playTapSound();
              setReloadKey((k) => k + 1);
            }}
            className="font-semibold underline hover:no-underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Loyalty Balance Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#06142E] via-[#071E47] to-[#0B326B] text-white p-5 border border-[#00CFFF]/35 shadow-[0_18px_40px_-18px_rgba(7,26,61,0.55)]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-lab-grid-dark opacity-70" />
        <div
          aria-hidden="true"
          className="animate-reward-glow pointer-events-none absolute -top-16 -right-12 w-48 h-48 rounded-full bg-[radial-gradient(circle,rgba(0,207,255,0.24)_0%,rgba(8,102,245,0.12)_50%,transparent_72%)]"
        />

        <div className="relative z-10 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#2DD4BF]">
                <Award className="w-3.5 h-3.5 text-[#00CFFF] shrink-0" />
                <span>{currentTierName}</span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
                <span className="font-mono text-3xl sm:text-[34px] font-extrabold tracking-tight text-white tabular-nums leading-none">
                  {availablePoints.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-sky-200">
                  Points Available
                </span>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-[#00CFFF]/15 border border-[#00CFFF]/40 text-right shrink-0">
              <p className="font-mono text-[9.5px] uppercase tracking-wider text-sky-200">
                Reward Value
              </p>
              <p className="font-mono text-base sm:text-lg font-extrabold text-white tabular-nums leading-tight">
                ৳{formattedBdtValue}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/15">
            <div className="rounded-xl bg-white/[0.06] border border-white/10 px-2.5 py-2">
              <p className="font-mono text-[9.5px] uppercase tracking-wider text-amber-200 truncate">
                Pending
              </p>
              <p className="font-mono text-sm font-bold text-white tabular-nums mt-0.5">
                {pendingPoints.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="rounded-xl bg-white/[0.06] border border-white/10 px-2.5 py-2">
              <p className="font-mono text-[9.5px] uppercase tracking-wider text-[#2DD4BF] truncate">
                Lifetime Earned
              </p>
              <p className="font-mono text-sm font-bold text-white tabular-nums mt-0.5">
                {lifetimeEarned.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="rounded-xl bg-white/[0.06] border border-white/10 px-2.5 py-2">
              <p className="font-mono text-[9.5px] uppercase tracking-wider text-sky-200 truncate">
                Redeemed
              </p>
              <p className="font-mono text-sm font-bold text-white tabular-nums mt-0.5">
                {lifetimeRedeemed.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Trackers: Next ৳8 Reward + Loyalty Tier */}
      <div className="grid grid-cols-1 gap-3">
        {/* Next ৳8 Reward Milestone */}
        <div className="rounded-2xl bg-[#EDF2F8] border border-slate-300/85 p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Coins className="w-4 h-4 text-[#0866F5] shrink-0" />
              <p className="font-display text-xs sm:text-sm font-bold text-[#071A3B] truncate">
                Next ৳{REWARD_BDT_PER_100_POINTS} Reward Milestone
              </p>
            </div>
            <span className="font-mono text-[11px] font-bold text-[#0866F5] tabular-nums shrink-0">
              {currentCyclePoints.toLocaleString('en-IN')} / {cycleSize} pts ({cyclePct}%)
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-white border border-slate-300/70 overflow-hidden">
            <div
              className="relative h-full rounded-full bg-gradient-to-r from-[#0866F5] to-[#0F766E] transition-all duration-500 overflow-hidden"
              style={{ width: `${cyclePct}%` }}
            >
              <div className="animate-bar-shimmer absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/45 to-transparent" />
            </div>
          </div>

          <p className="text-[11.5px] text-[#334155]">
            {pointsNeededForNextReward === 0 ? (
              <>
                Milestone reached! You have{' '}
                <strong className="font-mono text-[#0F766E] tabular-nums">
                  {unlockedRewardBlocks} × ৳{REWARD_BDT_PER_100_POINTS}
                </strong>{' '}
                (৳{(unlockedRewardBlocks * REWARD_BDT_PER_100_POINTS).toLocaleString('en-IN')}) redeemable in multiples of {cycleSize} points.
              </>
            ) : (
              <>
                Only{' '}
                <strong className="font-mono text-[#071A3B] tabular-nums">
                  {pointsNeededForNextReward.toLocaleString('en-IN')} more points
                </strong>{' '}
                needed for your next ৳{REWARD_BDT_PER_100_POINTS} checkout reward.
              </>
            )}
          </p>
        </div>

        {/* Next Loyalty Tier Tracker */}
        <div className="rounded-2xl bg-white border border-slate-300/85 p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <TrendingUp className="w-4 h-4 text-[#0F766E] shrink-0" />
              <p className="font-display text-xs sm:text-sm font-bold text-[#071A3B] truncate">
                {nextTier ? `Tier Progress: ${currentTier.name} → ${nextTier.name}` : `Top Tier: ${currentTier.name}`}
              </p>
            </div>
            <span className="font-mono text-[11px] font-bold text-[#0F766E] tabular-nums shrink-0">
              {tierProgressPct}%
            </span>
          </div>

          <div className="h-1.5 w-full rounded-full bg-[#EDF2F8] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0F766E] to-[#0866F5] transition-all duration-500"
              style={{ width: `${tierProgressPct}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#475569]">
            <span>
              {nextTier
                ? `Earn ${pointsToNextTier.toLocaleString('en-IN')} more lifetime points to reach ${nextTier.name}.`
                : 'Maximum Autonomous Pioneer loyalty rank unlocked.'}
            </span>
            <span className="font-mono text-[10.5px] font-semibold text-[#071A3B] tabular-nums">
              ৳{MIN_ORDER_FOR_REWARD_BDT.toLocaleString('en-IN')} order = {REWARD_POINTS_PER_1000_BDT} pts · 100 pts = ৳{REWARD_BDT_PER_100_POINTS}
            </span>
          </div>
        </div>
      </div>

      {/* Robotera BD Reward Rules Guide */}
      <div className="rounded-2xl bg-[#EDF2F8]/80 border border-slate-300/80 p-3.5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#475569] inline-flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-[#0866F5]" />
            <span>Robotera Loyalty Rules</span>
          </p>
          <span className="text-[10.5px] font-medium text-[#0F766E]">Credited on Delivery</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-white border border-slate-200 px-2 py-2">
            <p className="text-[10.5px] font-semibold text-[#334155]">Minimum Order</p>
            <p className="font-mono text-xs font-extrabold text-[#0866F5] tabular-nums mt-0.5">
              ৳{MIN_ORDER_FOR_REWARD_BDT.toLocaleString('en-IN')}+
            </p>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 px-2 py-2">
            <p className="text-[10.5px] font-semibold text-[#334155]">Earn Rate</p>
            <p className="font-mono text-xs font-extrabold text-[#071A3B] tabular-nums mt-0.5">
              {REWARD_POINTS_PER_1000_BDT} pts / ৳1,000
            </p>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 px-2 py-2">
            <p className="text-[10.5px] font-semibold text-[#334155]">Point Value</p>
            <p className="font-mono text-xs font-extrabold text-[#0F766E] tabular-nums mt-0.5">
              100 pts = ৳{REWARD_BDT_PER_100_POINTS}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-sm font-bold text-[#071A3B] inline-flex items-center gap-1.5">
            <History className="w-4 h-4 text-[#0866F5]" />
            <span>Points Ledger</span>
          </h3>

          <div className="flex items-center gap-1.5">
            {(['all', 'Earned', 'Pending', 'Redeemed'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  playTapSound();
                  setTxFilter(status);
                }}
                className={`px-2 py-1 rounded-lg text-[10.5px] font-semibold border transition-colors ${
                  txFilter === status
                    ? 'bg-[#071A3B] border-[#071A3B] text-white'
                    : 'bg-white border-slate-300/80 text-[#475569] hover:text-[#071A3B]'
                }`}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setReloadKey((k) => k + 1);
              }}
              aria-label="Refresh reward ledger"
              className="p-1.5 rounded-lg border border-slate-300/80 bg-white text-[#475569] hover:text-[#071A3B] transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="py-8 px-4 bg-[#EDF2F8] rounded-2xl border border-slate-300/85 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-xl bg-white border border-slate-300 flex items-center justify-center text-[#0866F5]">
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="font-display text-sm font-bold text-[#071A3B]">
              {transactions.length === 0 ? 'No point transactions yet' : `No ${txFilter.toLowerCase()} entries`}
            </p>
            <p className="text-xs text-[#475569] max-w-xs mx-auto leading-relaxed">
              Reward points appear as Pending once an order is confirmed and automatically credit to
              your available balance upon delivery.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map((tx) => {
              const cfg = STATUS_BADGE_CONFIG[tx.status] || STATUS_BADGE_CONFIG.Pending;
              const StatusIcon = cfg.icon;
              const isDebit =
                tx.transactionType === 'redeemed' ||
                tx.transactionType === 'manual_deduct' ||
                tx.transactionType === 'expired' ||
                tx.status === 'Reversed';

              return (
                <div
                  key={tx.id}
                  className="rounded-xl border border-slate-300/85 bg-white p-3.5 flex items-start justify-between gap-3 hover:border-[#0866F5]/60 transition-colors"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display text-xs font-bold text-[#071A3B]">
                        {TX_TYPE_LABELS[tx.transactionType] || 'Reward Update'}
                      </span>
                      {tx.orderId && (
                        <span className="font-mono text-[10.5px] font-semibold text-[#0866F5]">
                          #{tx.orderId}
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold ${cfg.cls}`}
                      >
                        <StatusIcon className="w-3 h-3 shrink-0" />
                        <span>{tx.status}</span>
                      </span>
                    </div>
                    <p className="text-xs text-[#334155] leading-snug">{tx.description}</p>
                    <p className="font-mono text-[10px] text-[#64748B]">
                      {formatTxDate(tx.createdAt)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`inline-flex items-center gap-0.5 font-mono text-sm font-extrabold tabular-nums ${
                        isDebit
                          ? 'text-red-700'
                          : tx.status === 'Pending'
                          ? 'text-amber-700'
                          : 'text-[#0F766E]'
                      }`}
                    >
                      {isDebit ? (
                        <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>
                        {isDebit ? '-' : '+'}
                        {Math.abs(tx.points).toLocaleString('en-IN')}
                      </span>
                    </span>
                    <p className="font-mono text-[10px] text-[#64748B]">pts</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
