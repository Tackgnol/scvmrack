import type { CreatorIssue } from "../creatorShared.models";

export type IssueListProps = {
  issues: CreatorIssue[];
  onFix: (issue: CreatorIssue) => void;
};
