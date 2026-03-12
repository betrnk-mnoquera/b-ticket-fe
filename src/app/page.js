'use client'

import Link from 'next/link'
import { Line, Bar } from 'react-chartjs-2'
import 'chart.js/auto'
import PageHeader from '@/components/layout/PageHeader'
import StatsCard from '@/components/ui/StatsCard'
import StatusBadge from '@/components/ui/StatusBadge'
import Icon from '@/components/ui/Icon'
import {
  dashboardStats, revenueChartData, subscriberChartData,
  storePerformanceData, adsPerformanceData,
} from '@/data/mockData'

const orgsSummary = [
  { name: 'Acme Corp', stores: 12, status: 'active' },
  { name: 'TechHub Inc', stores: 8, status: 'active' },
  { name: 'Style Group', stores: 5, status: 'pending' },
  { name: 'HealthFirst Ltd', stores: 3, status: 'inactive' },
]

const adsSummary = [
  { name: 'Summer Promo Blast', budget: '$2,400', status: 'running' },
  { name: 'Mobile App Launch', budget: '$1,800', status: 'running' },
  { name: 'Holiday Sale Banner', budget: '$3,600', status: 'scheduled' },
]

const subsSummary = [
  { name: 'Maria Santos', email: 'maria@email.com', initials: 'MS', status: 'active' },
  { name: 'James Cruz', email: 'james@email.com', initials: 'JC', status: 'active' },
  { name: 'Anna Reyes', email: 'anna@email.com', initials: 'AR', status: 'expiring' },
  { name: 'Carlos Garcia', email: 'carlos@email.com', initials: 'CG', status: 'active' },
  { name: 'Diana Lee', email: 'diana@email.com', initials: 'DL', status: 'trial' },
]

export default function Dashboard() {
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

      <div className="grid grid-cols-4 gap-4 mb-6">
        {dashboardStats.map((stat, i) => (
          <StatsCard key={i} {...stat} />
        ))}
      </div>

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
        </SummaryCard>

        <SummaryCard title="Ads Management" linkTo="/ads" linkLabel="View All">
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
        </SummaryCard>

        <SummaryCard title="Subscribers" linkTo="/subscribers" linkLabel="View All">
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
