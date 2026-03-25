import type { UserResult } from '../lib/types'
import Heatmap from './Heatmap'
import StatsBar from './StatsBar'

interface ContributionCardProps {
  username: string
  result: UserResult
}

export default function ContributionCard({ username, result }: ContributionCardProps) {
  const collection = result.data?.contributionsCollection
  const totalContributions = collection?.contributionCalendar.totalContributions

  return (
    <div className="bg-gh-card rounded-xl px-5 py-4 border border-gh-border">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        {result.data ? (
          <img src={result.data.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gh-badge" />
        )}
        <div>
          <span className="font-semibold text-[15px]">{username}</span>
          {totalContributions != null && (
            <span className="text-gh-text-secondary text-xs ml-2">
              {totalContributions} contributions
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      {result.loading && (
        <div className="text-gh-text-secondary text-[13px] py-[30px] text-center">Loading...</div>
      )}
      {result.error && <div className="text-gh-danger text-[13px] py-3">{result.error}</div>}
      {collection && (
        <>
          <Heatmap weeks={collection.contributionCalendar.weeks} />
          <StatsBar collection={collection} />
        </>
      )}
    </div>
  )
}
