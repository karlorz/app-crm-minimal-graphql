import gql from "graphql-tag";

export const DASHBOARD_TOTAL_COUNTS_QUERY = gql`
  query DashboardTotalCounts {
    companies(filter: {}, sorting: [], paging: { limit: 1, offset: 0 }) {
      totalCount
    }
    contacts(filter: {}, sorting: [], paging: { limit: 1, offset: 0 }) {
      totalCount
    }
    deals(filter: {}, sorting: [], paging: { limit: 1, offset: 0 }) {
      totalCount
    }
  }
`;
