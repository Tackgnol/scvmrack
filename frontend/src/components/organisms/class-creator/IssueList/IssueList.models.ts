import type { CreatorIssue } from "../classCreator.models";

export type IssueListProps = {
  issues: CreatorIssue[];
  onFix: (issue: CreatorIssue) => void;
};
