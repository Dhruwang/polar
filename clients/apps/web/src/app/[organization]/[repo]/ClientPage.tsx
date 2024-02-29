'use client'

import { externalURL, prettyURL } from '@/components/Organization'
import IssuesLookingForFunding from '@/components/Organization/IssuesLookingForFunding'
import HowItWorks from '@/components/Pledge/HowItWorks'
import { useTrafficRecordPageView } from '@/utils/traffic'
import {
  ListResourceIssueFunding,
  Organization,
  Repository,
  Visibility,
} from '@polar-sh/sdk'
import { Banner } from 'polarkit/components/ui/molecules'
import { formatStarsNumber } from 'polarkit/utils'

const ClientPage = ({
  organization,
  repository,
  issuesFunding,
  totalIssueCount,
}: {
  organization: Organization
  repository: Repository
  issuesFunding: ListResourceIssueFunding
  totalIssueCount: number
}) => {
  useTrafficRecordPageView({ organization })

  return (
    <>
      {repository.visibility === Visibility.PRIVATE && (
        <Banner color="muted">
          This is a private repository. Only logged in users that are members of{' '}
          {repository.organization.name} can see it.
        </Banner>
      )}

      <h1 className="dark:text-polar-100 text-center text-3xl font-normal text-gray-800 md:text-3xl">
        {organization.name}/{repository.name} has{' '}
        {totalIssueCount > 0 ? totalIssueCount : 'no'}{' '}
        {totalIssueCount === 1 ? 'issue' : 'issues'} looking for funding
      </h1>

      <div className="flex flex-col items-center space-y-4">
        {repository.description && (
          <p className="dark:text-polar-500 text-center  text-gray-500">
            {repository.description}
          </p>
        )}

        <div className="dark:text-polar-400 flex flex-wrap items-center space-x-4 text-gray-600">
          {repository.license && <p>{repository.license}</p>}

          <p>{formatStarsNumber(repository.stars || 0)} stars</p>

          {repository.homepage && (
            <a
              className="text-blue-500 hover:text-blue-700"
              href={externalURL(repository.homepage)}
            >
              {prettyURL(repository.homepage)}
            </a>
          )}
        </div>
      </div>

      <IssuesLookingForFunding
        organization={organization}
        repository={repository}
        issues={issuesFunding}
      />

      <HowItWorks />
    </>
  )
}

export default ClientPage