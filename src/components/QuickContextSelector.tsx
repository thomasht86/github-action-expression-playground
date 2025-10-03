import { useState } from 'react'
import { GitHubContext } from '../types'

interface QuickContextSelectorProps {
  github: Partial<GitHubContext>
  onGitHubChange: (github: Partial<GitHubContext>) => void
}

type EventPreset = 'push' | 'pull_request' | 'release' | 'workflow_dispatch'

const eventPresets: Record<EventPreset, Partial<GitHubContext>> = {
  push: {
    event_name: 'push',
    ref: 'refs/heads/main',
    ref_name: 'main',
    ref_type: 'branch',
    base_ref: '',
    head_ref: '',
    event: {
      ref: 'refs/heads/main',
      before: '0000000000000000000000000000000000000000',
      after: 'ffac537e6cbbf934b08745a378932722df287a53',
      repository: {
        id: 123456789,
        name: 'hello-world',
        full_name: 'octocat/hello-world',
        owner: {
          login: 'octocat',
          id: 1
        },
        default_branch: 'main',
        private: false
      },
      pusher: {
        name: 'octocat',
        email: 'octocat@github.com'
      },
      commits: [
        {
          id: 'ffac537e6cbbf934b08745a378932722df287a53',
          message: 'Update README.md',
          author: {
            name: 'octocat',
            email: 'octocat@github.com'
          }
        }
      ]
    }
  },
  pull_request: {
    event_name: 'pull_request',
    ref: 'refs/pull/123/merge',
    ref_name: '123/merge',
    ref_type: 'branch',
    base_ref: 'main',
    head_ref: 'feature/new-feature',
    event: {
      action: 'opened',
      number: 123,
      pull_request: {
        id: 987654321,
        number: 123,
        state: 'open',
        title: 'Add new feature',
        user: {
          login: 'octocat',
          id: 1
        },
        body: 'This PR adds a new feature',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z',
        head: {
          ref: 'feature/new-feature',
          sha: 'abc123def456',
          repo: {
            name: 'hello-world',
            full_name: 'octocat/hello-world'
          }
        },
        base: {
          ref: 'main',
          sha: 'ffac537e6cbbf934b08745a378932722df287a53',
          repo: {
            name: 'hello-world',
            full_name: 'octocat/hello-world'
          }
        },
        merged: false,
        mergeable: true
      },
      repository: {
        id: 123456789,
        name: 'hello-world',
        full_name: 'octocat/hello-world',
        owner: {
          login: 'octocat',
          id: 1
        },
        default_branch: 'main',
        private: false
      }
    }
  },
  release: {
    event_name: 'release',
    ref: 'refs/tags/v1.0.0',
    ref_name: 'v1.0.0',
    ref_type: 'tag',
    base_ref: '',
    head_ref: '',
    event: {
      action: 'published',
      release: {
        id: 555666777,
        tag_name: 'v1.0.0',
        target_commitish: 'main',
        name: 'Version 1.0.0',
        draft: false,
        prerelease: false,
        created_at: '2024-01-15T12:00:00Z',
        published_at: '2024-01-15T12:00:00Z',
        author: {
          login: 'octocat',
          id: 1
        },
        body: 'First stable release'
      },
      repository: {
        id: 123456789,
        name: 'hello-world',
        full_name: 'octocat/hello-world',
        owner: {
          login: 'octocat',
          id: 1
        },
        default_branch: 'main',
        private: false
      }
    }
  },
  workflow_dispatch: {
    event_name: 'workflow_dispatch',
    ref: 'refs/heads/main',
    ref_name: 'main',
    ref_type: 'branch',
    base_ref: '',
    head_ref: '',
    event: {
      inputs: {
        environment: 'production',
        debug: 'false'
      },
      ref: 'refs/heads/main',
      repository: {
        id: 123456789,
        name: 'hello-world',
        full_name: 'octocat/hello-world',
        owner: {
          login: 'octocat',
          id: 1
        },
        default_branch: 'main',
        private: false
      },
      sender: {
        login: 'octocat',
        id: 1
      }
    }
  }
}

export function QuickContextSelector({ github, onGitHubChange }: QuickContextSelectorProps) {
  const [branch, setBranch] = useState(github.ref_name || 'main')
  const [eventPreset, setEventPreset] = useState<EventPreset>('push')

  const handleBranchChange = (newBranch: string) => {
    setBranch(newBranch)
  }

  const handleEventPresetChange = (preset: EventPreset) => {
    setEventPreset(preset)
  }

  const handleApply = () => {
    const presetContext = eventPresets[eventPreset]

    // Update ref based on branch and event type
    let ref = `refs/heads/${branch}`
    let ref_name = branch
    let ref_type = 'branch'

    if (eventPreset === 'pull_request') {
      ref = `refs/pull/123/merge`
      ref_name = '123/merge'
      // Update event payload
      if (presetContext.event && typeof presetContext.event === 'object') {
        presetContext.event = {
          ...presetContext.event,
          pull_request: {
            ...(presetContext.event as any).pull_request,
            base: {
              ...(presetContext.event as any).pull_request.base,
              ref: branch
            },
            head: {
              ...(presetContext.event as any).pull_request.head,
              ref: `feature/${branch}-feature`
            }
          }
        }
      }
    } else if (eventPreset === 'release') {
      ref = `refs/tags/v1.0.0`
      ref_name = 'v1.0.0'
      ref_type = 'tag'
    } else {
      // For push and workflow_dispatch
      ref = `refs/heads/${branch}`
      ref_name = branch
    }

    onGitHubChange({
      ...github,
      ...presetContext,
      ref,
      ref_name,
      ref_type
    })
  }

  return (
    <div className="quick-context-selector">
      <div className="selector-group">
        <label htmlFor="branch-input">Branch:</label>
        <input
          id="branch-input"
          type="text"
          value={branch}
          onChange={(e) => handleBranchChange(e.target.value)}
          placeholder="main"
          className="branch-input"
          list="branch-suggestions"
        />
        <datalist id="branch-suggestions">
          <option value="main" />
          <option value="develop" />
          <option value="feature/new-feature" />
          <option value="release/v1.0" />
          <option value="hotfix/critical-fix" />
        </datalist>
      </div>

      <div className="selector-group">
        <label htmlFor="event-select">Event:</label>
        <select
          id="event-select"
          value={eventPreset}
          onChange={(e) => handleEventPresetChange(e.target.value as EventPreset)}
          className="event-select"
        >
          <option value="push">Push to branch</option>
          <option value="pull_request">Pull request</option>
          <option value="release">Release published</option>
          <option value="workflow_dispatch">Manual workflow_dispatch</option>
        </select>
      </div>

      <button onClick={handleApply} className="apply-button">
        Apply
      </button>
    </div>
  )
}
