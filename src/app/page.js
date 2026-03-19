'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Line, Bar } from 'react-chartjs-2'
import 'chart.js/auto'
import PageHeader from '@/components/layout/PageHeader'
import StatsCard from '@/components/ui/StatsCard'
import StatusBadge from '@/components/ui/StatusBadge'
import Icon from '@/components/ui/Icon'
import LoadingSkeleton, { CardSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton'
import { userService } from '@/lib/api/services/userService'
import { couponService } from '@/lib/api/services/couponService'
import { campaignService } from '@/lib/api/services/campaignService'
import { subscriberService } from '@/lib/api/services/subscriberService'
import { brochureService } from '@/lib/api/services/brochureService'
import { storeService } from '@/lib/api/services/storeService'

const revenueChartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  values: [32000, 35000, 38000, 36000, 42000, 45000, 43000, 48000, 46000, 50000, 52000, 48200],
}

const subscriberChartData = {
  labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
  newSubscribers: [180, 220, 195, 260, 310, 285],
  churned: [25, 30, 18, 22, 35, 28],
}

const storePerformanceData = {
  labels: ['Acme Downtown', 'Fashion Avenue', 'TechHub Central', 'Bella Spa', 'Pet Paradise', 'Green Garden'],
  values: [48200, 42100, 38700, 31500, 28900, 24600],
}

const adsPerformanceData = {
  labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
  impressions: [42000, 45000, 48000, 44000, 47000],
  clicks: [1800, 2100, 2400, 1950, 2200],
  conversions: [320, 380, 420, 350, 400],
}

export default function Dashboard() {
  const [dashboardStats, setDashboardStats] = useState([])
  const [orgsSummary, setOrgsSummary] = useState([])
  const [adsSummary, setAdsSummary] = useState([])
  const [subsSummary, setSubsSummary] = useState([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [userStats, couponStats, campaignStats, subscriberStats, brochureStats] = await Promise.all([
          userService.getStats(),
          couponService.getStats(),
          campaignService.getStats(),
          subscriberService.getStats(),
          brochureService.getStats(),
        ])

        setDashboardStats([
          {
            icon: 'corporate_fare',
            label: 'Total Organizations',
            value: (userStats.data?.totalOrganizations ?? 0).toLocaleString(),
            change: userStats.data?.organizationsChange ? `${userStats.data.organizationsChange > 0 ? '+' : ''}${userStats.data.organizationsChange}%` : undefined,
          },
          {
            icon: 'store',
            label: 'Active Stores',
            value: (couponStats.data?.activeStores ?? subscriberStats.data?.activeStores ?? 0).toLocaleString(),
            change: couponStats.data?.storesChange ? `${couponStats.data.storesChange > 0 ? '+' : ''}${couponStats.data.storesChange}%` : undefined,
          },
          {
            icon: 'group',
            label: 'Total Subscribers',
            value: (subscriberStats.data?.totalSubscribers ?? 0).toLocaleString(),
            change: subscriberStats.data?.subscribersChange ? `${subscriberStats.data.subscribersChange > 0 ? '+' : ''}${subscriberStats.data.subscribersChange}%` : undefined,
          },
          {
            icon: 'payments',
            label: 'Revenue (MRR)',
            value: subscriberStats.data?.mrr ? `$${(subscriberStats.data.mrr / 1000).toFixed(1)}K` : '$0',
            change: subscriberStats.data?.mrrChange ? `${subscriberStats.data.mrrChange > 0 ? '+' : ''}${subscriberStats.data.mrrChange}%` : undefined,
            highlight: true,
          },
        ])
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      } finally {
        setStatsLoading(false)
      }
    }

    async function fetchSummaries() {
      try {
        const [storesRes, campaignsRes, subscribersRes] = await Promise.all([
          storeService.getStores({ perPage: 4 }),
          campaignService.getCampaigns({ status: 'running', perPage: 3 }),
          subscriberService.getSubscribers({ perPage: 5 }),
        ])

        setOrgsSummary(
          (storesRes.data?.data ?? storesRes.data ?? []).map((store) => ({
            name: (typeof store.organization === 'object' ? store.organization?.name : store.organization) ?? store.name ?? '',
            stores: store.storeCount ?? store.stores ?? 0,
            status: store.status ?? 'active',
          }))
        )

        setAdsSummary(
          (campaignsRes.data?.data ?? campaignsRes.data ?? []).map((campaign) => ({
            name: campaign.name ?? '',
            budget: campaign.budget != null ? `$${Number(campaign.budget).toLocaleString()}` : '$0',
            status: campaign.status ?? 'running',
          }))
        )

        setSubsSummary(
          (subscribersRes.data?.data ?? subscribersRes.data ?? []).map((sub) => {
            const nameParts = (sub.name ?? '').split(' ')
            const initials = nameParts.length >= 2
              ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
              : (sub.name ?? '').slice(0, 2).toUpperCase()
            return {
              name: sub.name ?? '',
              email: sub.email ?? '',
              initials,
              status: sub.status ?? 'active',
            }
          })
        )
      } catch (error) {
        console.error('Failed to fetch summary data:', error)
      } finally {
        setSummaryLoading(false)
      }
    }

    fetchStats()
    fetchSummaries()
  }, [])

  const revenueConfig = {
    data: {
      labels: revenueChartData.labels,
      datasets: [{
        label: 'Revenue',
        data: revenueChartData.values,
        borderColor: '#205C50',
        backgroundColor: 'rgba(32,92,80,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      }],
    },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: v => `$${v/1000}K` } } } },
  }

  const subscriberConfig = {
    data: {
      labels: subscriberChartData.labels,
      datasets: [
        { label: 'New Subscribers', data: subscriberChartData.newSubscribers, borderColor: '#205C50', backgroundColor: 'transparent', tension: 0.4, pointRadius: 3 },
        { label: 'Churned', data: subscriberChartData.churned, borderColor: '#EE4036', backgroundColor: 'transparent', borderDash: [5, 5], tension: 0.4, pointRadius: 3 },
      ],
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'line' } } }, scales: { y: { beginAtZero: true } } },
  }

  const storeConfig = {
    data: {
      labels: storePerformanceData.labels,
      datasets: [{
        label: 'Revenue',
        data: storePerformanceData.values,
        backgroundColor: '#205C50',
        borderRadius: 6,
      }],
    },
    options: { responsive: true, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { ticks: { callback: v => `$${v/1000}K` } } } },
  }

  const adsConfig = {
    data: {
      labels: adsPerformanceData.labels,
      datasets: [
        { label: 'Impressions', data: adsPerformanceData.impressions, backgroundColor: '#205C50', borderRadius: 4 },
        { label: 'Clicks', data: adsPerformanceData.clicks, backgroundColor: '#84BEA1', borderRadius: 4 },
        { label: 'Conversions', data: adsPerformanceData.conversions, backgroundColor: '#50C9BF', borderRadius: 4 },
      ],
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'rect' } } } },
  }

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="Manage your organizations, stores, coupons, and more" />

      {statsLoading ? (
        <div className="mb-6">
          <CardSkeleton count={4} />
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {dashboardStats.map((stat, i) => (
            <div key={i} className="hover:-translate-y-0.5 transition-transform duration-200">
              <StatsCard {...stat} />
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <ChartCard title="Revenue Overview" badge="Last 12 months">
          <Line {...revenueConfig} />
        </ChartCard>
        <ChartCard title="Subscriber Growth" badge="Last 6 months">
          <Line {...subscriberConfig} />
        </ChartCard>
        <ChartCard title="Best Performing Stores" badge="Last 30 days">
          <Bar {...storeConfig} />
        </ChartCard>
        <ChartCard title="Ads Performance" badge="Last 5 weeks">
          <Bar {...adsConfig} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <SummaryCard title="Organizations & Stores" linkTo="/organizations" linkLabel="View All">
          {summaryLoading ? (
            <TableSkeleton rows={4} />
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-left py-2 font-medium">Organization</th>
                <th className="text-left py-2 font-medium">Stores</th>
                <th className="text-left py-2 font-medium">Status</th>
              </tr></thead>
              <tbody>
                {orgsSummary.map((o, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-2.5 font-medium">{o.name}</td>
                    <td className="py-2.5">{o.stores}</td>
                    <td className="py-2.5"><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SummaryCard>

        <SummaryCard title="Ads Management" linkTo="/ads" linkLabel="View All">
          {summaryLoading ? (
            <TableSkeleton rows={3} />
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-left py-2 font-medium">Campaign</th>
                <th className="text-left py-2 font-medium">Budget</th>
                <th className="text-left py-2 font-medium">Status</th>
              </tr></thead>
              <tbody>
                {adsSummary.map((a, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-2.5 font-medium">{a.name}</td>
                    <td className="py-2.5">{a.budget}</td>
                    <td className="py-2.5"><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SummaryCard>

        <SummaryCard title="Subscribers" linkTo="/subscribers" linkLabel="View All">
          {summaryLoading ? (
            <TableSkeleton rows={5} />
          ) : (
            <div className="space-y-2.5">
              {subsSummary.map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{s.initials}</div>
                    <div>
                      <div className="text-sm font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.email}</div>
                    </div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              ))}
            </div>
          )}
        </SummaryCard>
      </div>
    </div>
  )
}

function ChartCard({ title, badge, children }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{badge}</span>
      </div>
      {children}
    </div>
  )
}

function SummaryCard({ title, linkTo, linkLabel, children }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <Link href={linkTo} className="text-xs font-medium text-primary hover:underline">{linkLabel}</Link>
      </div>
      {children}
    </div>
  )
}
