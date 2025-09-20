const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const { PubSub } = require('graphql-subscriptions');
const cors = require('cors');
const fs = require('fs');

const pubsub = new PubSub();

// Load demo data from file
let demoData = {};

try {
  const demoDataFile = fs.readFileSync('./demo-data.json', 'utf8');
  demoData = JSON.parse(demoDataFile);
  console.log('📊 Loaded demo data with:');
  console.log(`👥 Users: ${demoData.users?.length || 0}`);
  console.log(`🏢 Companies: ${demoData.companies?.length || 0}`);
  console.log(`👤 Contacts: ${demoData.contacts?.length || 0}`);
  console.log(`📈 Deals: ${demoData.deals?.length || 0}`);
  console.log(`📋 Tasks: ${demoData.tasks?.length || 0}`);
  console.log(`📅 Events: ${demoData.events?.length || 0}`);
} catch (error) {
  console.log('⚠️  No demo data file found, using minimal mock data');
  demoData = {
    users: [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@refine.dev',
        avatarUrl: 'https://i.pravatar.cc/150?img=1',
        jobTitle: 'Sales Manager',
        phone: '+1-555-0123',
        timezone: 'America/New_York',
        role: 'ADMIN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    companies: [],
    contacts: [],
    deals: [],
    dealStages: [],
    tasks: [],
    taskStages: [],
    events: []
  };
}

// Mock data arrays (using loaded demo data)
let users = demoData.users || [];

let companies = demoData.companies || [];
let contacts = demoData.contacts || [];
let dealStages = demoData.dealStages || [];
let deals = demoData.deals || [];
let taskStages = demoData.taskStages || [];
let tasks = demoData.tasks || [];
let events = demoData.events || [];
let audits = demoData.audits || [
  {
    id: '1',
    action: 'CREATE',
    targetEntity: 'Deal',
    targetId: '1',
    changes: {
      field: 'title',
      from: null,
      to: 'Product Demo',
      description: 'Created new deal: Product Demo'
    },
    userId: '1',
    createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
  },
  {
    id: '2',
    action: 'UPDATE',
    targetEntity: 'Company',
    targetId: '1',
    changes: {
      field: 'totalRevenue',
      from: '500000',
      to: '750000',
      description: 'Updated company revenue from $500K to $750K'
    },
    userId: '2',
    createdAt: new Date(Date.now() - 172800000).toISOString() // 2 days ago
  },
  {
    id: '3',
    action: 'CREATE',
    targetEntity: 'Contact',
    targetId: '1',
    changes: {
      field: 'name',
      from: null,
      to: 'John Smith',
      description: 'Added new contact: John Smith'
    },
    userId: '1',
    createdAt: new Date(Date.now() - 259200000).toISOString() // 3 days ago
  },
  {
    id: '4',
    action: 'LOGIN',
    targetEntity: 'User',
    targetId: '1',
    changes: {
      field: 'lastLogin',
      from: null,
      to: new Date().toISOString(),
      description: 'User logged in'
    },
    userId: '1',
    createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  },
  {
    id: '5',
    action: 'UPDATE',
    targetEntity: 'Task',
    targetId: '1',
    changes: {
      field: 'completed',
      from: 'false',
      to: 'true',
      description: 'Marked task as completed'
    },
    userId: '2',
    createdAt: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
  }
];

// Simple in-memory session store
const activeSessions = new Map();

// GraphQL schema
const typeDefs = gql`
  scalar DateTime

  enum UserRole {
    ADMIN
    MANAGER
    SALES_PERSON
  }

  enum CompanySize {
    ENTERPRISE
    LARGE
    MEDIUM
    SMALL
  }

  enum ContactStage {
    CUSTOMER
    LEAD
    SALES_QUALIFIED_LEAD
  }

  enum ContactStatus {
    ACTIVE
    INACTIVE
    PENDING
  }

  type User {
    id: ID!
    name: String!
    email: String!
    avatarUrl: String
    jobTitle: String
    phone: String
    timezone: String
    role: UserRole!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Company {
    id: ID!
    name: String!
    avatarUrl: String
    businessType: String
    companySize: CompanySize
    industry: String
    totalRevenue: Float
    salesOwner: User
    contacts(paging: OffsetPaging, filter: ContactFilter, sorting: [ContactSort!]): ContactConnection
    deals(paging: OffsetPaging, filter: DealFilter, sorting: [DealSort!]): DealConnection
    dealsAggregate(filter: DealFilter): [DealAggregateResponse!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Contact {
    id: ID!
    name: String!
    email: String!
    avatarUrl: String
    jobTitle: String
    phone: String
    stage: ContactStage!
    status: ContactStatus!
    company: Company
    salesOwner: User
    deals(paging: OffsetPaging, filter: DealFilter, sorting: [DealSort!]): DealConnection
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type DealStage {
    id: ID!
    title: String!
    deals(paging: OffsetPaging, filter: DealFilter, sorting: [DealSort!]): DealConnection
    dealsAggregate(filter: DealFilter): [DealAggregateResponse!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Deal {
    id: ID!
    title: String!
    value: Float!
    stage: DealStage
    company: Company
    contact: Contact
    salesOwner: User
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type TaskStage {
    id: ID!
    title: String!
    tasks(paging: OffsetPaging, filter: TaskFilter, sorting: [TaskSort!]): TaskConnection
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Task {
    id: ID!
    title: String!
    description: String
    dueDate: DateTime
    completed: Boolean!
    stage: TaskStage
    stageId: ID
    assignedTo: User
    users: [User!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Event {
    id: ID!
    title: String!
    startDate: DateTime!
    endDate: DateTime!
    color: String!
    participants: [User!]
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # Audit/Activity Log System
  enum AuditAction {
    CREATE
    UPDATE
    DELETE
    LOGIN
    LOGOUT
  }

  type Audit {
    id: ID!
    action: AuditAction!
    targetEntity: String!
    targetId: ID!
    changes: AuditChanges
    user: User
    userId: ID
    createdAt: DateTime!
  }

  type AuditChanges {
    field: String
    from: String
    to: String
    description: String
  }

  # Connection types
  type UserConnection {
    nodes: [User!]!
    totalCount: Int!
    pageInfo: OffsetPageInfo!
  }

  type CompanyConnection {
    nodes: [Company!]!
    totalCount: Int!
    pageInfo: OffsetPageInfo!
  }

  type ContactConnection {
    nodes: [Contact!]!
    totalCount: Int!
    pageInfo: OffsetPageInfo!
  }

  type DealConnection {
    nodes: [Deal!]!
    totalCount: Int!
    pageInfo: OffsetPageInfo!
  }

  type DealStageConnection {
    nodes: [DealStage!]!
    totalCount: Int!
    pageInfo: OffsetPageInfo!
  }

  type TaskConnection {
    nodes: [Task!]!
    totalCount: Int!
    pageInfo: OffsetPageInfo!
  }

  type TaskStageConnection {
    nodes: [TaskStage!]!
    totalCount: Int!
    pageInfo: OffsetPageInfo!
  }

  type EventConnection {
    nodes: [Event!]!
    totalCount: Int!
    pageInfo: OffsetPageInfo!
  }

  type AuditConnection {
    nodes: [Audit!]!
    totalCount: Int!
    pageInfo: OffsetPageInfo!
  }

  # Aggregation types
  type DealAggregateResponse {
    sum: DealSumAggregate
    avg: DealAvgAggregate
    count: DealCountAggregate
    min: DealMinAggregate
    max: DealMaxAggregate
    groupBy: DealGroupBy
  }

  type DealGroupBy {
    stage: [DealStageGroupBy!]
    closeDateMonth: Int
    closeDateYear: Int
  }

  type DealDateGroupBy {
    date: String!
    sum: DealSumAggregate
    avg: DealAvgAggregate
    count: DealCountAggregate
    min: DealMinAggregate
    max: DealMaxAggregate
  }

  type DealStageGroupBy {
    id: ID!
    title: String!
    sum: DealSumAggregate
    avg: DealAvgAggregate
    count: DealCountAggregate
    min: DealMinAggregate
    max: DealMaxAggregate
  }

  type DealSumAggregate {
    value: Float
  }

  type DealAvgAggregate {
    value: Float
  }

  type DealCountAggregate {
    value: Int
  }

  type DealMinAggregate {
    value: Float
  }

  type DealMaxAggregate {
    value: Float
  }

  # Pagination
  input OffsetPaging {
    limit: Int
    offset: Int
  }

  type OffsetPageInfo {
    hasNextPage: Boolean
    hasPreviousPage: Boolean
  }

  # Filters
  input UserFilter {
    id: IDFilterComparison
    name: StringFieldComparison
    email: StringFieldComparison
    role: UserRoleFilterComparison
    and: [UserFilter!]
    or: [UserFilter!]
  }

  input CompanyFilter {
    id: IDFilterComparison
    name: StringFieldComparison
    companySize: CompanySizeFilterComparison
    and: [CompanyFilter!]
    or: [CompanyFilter!]
  }

  input ContactFilter {
    id: IDFilterComparison
    name: StringFieldComparison
    stage: ContactStageFilterComparison
    status: ContactStatusFilterComparison
    and: [ContactFilter!]
    or: [ContactFilter!]
  }

  input DealFilter {
    id: IDFilterComparison
    title: StringFieldComparison
    value: NumberFieldComparison
    and: [DealFilter!]
    or: [DealFilter!]
  }

  input TaskFilter {
    id: IDFilterComparison
    title: StringFieldComparison
    and: [TaskFilter!]
    or: [TaskFilter!]
  }

  input TaskStageFilter {
    id: IDFilterComparison
    title: StringFieldComparison
    and: [TaskStageFilter!]
    or: [TaskStageFilter!]
  }

  input DealStageFilter {
    id: IDFilterComparison
    title: StringFieldComparison
    and: [DealStageFilter!]
    or: [DealStageFilter!]
  }

  input EventFilter {
    id: IDFilterComparison
    title: StringFieldComparison
    startDate: DateFieldComparison
    endDate: DateFieldComparison
    and: [EventFilter!]
    or: [EventFilter!]
  }

  input AuditFilter {
    id: IDFilterComparison
    action: AuditActionFilterComparison
    targetEntity: StringFieldComparison
    targetId: IDFilterComparison
    userId: IDFilterComparison
    createdAt: DateFieldComparison
    and: [AuditFilter!]
    or: [AuditFilter!]
  }

  # Field comparisons
  input IDFilterComparison {
    eq: ID
    neq: ID
    in: [ID!]
    notIn: [ID!]
  }

  input StringFieldComparison {
    eq: String
    neq: String
    gt: String
    gte: String
    lt: String
    lte: String
    like: String
    notLike: String
    iLike: String
    notILike: String
    in: [String!]
    notIn: [String!]
  }

  input NumberFieldComparison {
    eq: Float
    neq: Float
    gt: Float
    gte: Float
    lt: Float
    lte: Float
    in: [Float!]
    notIn: [Float!]
  }

  input DateFieldComparison {
    eq: DateTime
    neq: DateTime
    gt: DateTime
    gte: DateTime
    lt: DateTime
    lte: DateTime
    in: [DateTime!]
    notIn: [DateTime!]
  }

  input UserRoleFilterComparison {
    eq: UserRole
    neq: UserRole
    in: [UserRole!]
    notIn: [UserRole!]
  }

  input CompanySizeFilterComparison {
    eq: CompanySize
    neq: CompanySize
    in: [CompanySize!]
    notIn: [CompanySize!]
  }

  input ContactStageFilterComparison {
    eq: ContactStage
    neq: ContactStage
    in: [ContactStage!]
    notIn: [ContactStage!]
  }

  input ContactStatusFilterComparison {
    eq: ContactStatus
    neq: ContactStatus
    in: [ContactStatus!]
    notIn: [ContactStatus!]
  }

  input AuditActionFilterComparison {
    eq: AuditAction
    neq: AuditAction
    in: [AuditAction!]
    notIn: [AuditAction!]
  }

  # Sorting
  enum SortDirection {
    ASC
    DESC
  }

  input UserSort {
    field: UserSortFields!
    direction: SortDirection!
  }

  input CompanySort {
    field: CompanySortFields!
    direction: SortDirection!
  }

  input ContactSort {
    field: ContactSortFields!
    direction: SortDirection!
  }

  input DealSort {
    field: DealSortFields!
    direction: SortDirection!
  }

  input TaskSort {
    field: TaskSortFields!
    direction: SortDirection!
  }

  input TaskStageSort {
    field: TaskStageSortFields!
    direction: SortDirection!
  }

  input DealStageSort {
    field: DealStageSortFields!
    direction: SortDirection!
  }

  input EventSort {
    field: EventSortFields!
    direction: SortDirection!
  }

  input AuditSort {
    field: AuditSortFields!
    direction: SortDirection!
  }

  enum UserSortFields {
    id
    name
    email
    createdAt
    updatedAt
  }

  enum CompanySortFields {
    id
    name
    totalRevenue
    createdAt
    updatedAt
  }

  enum ContactSortFields {
    id
    name
    email
    createdAt
    updatedAt
  }

  enum DealSortFields {
    id
    title
    value
    createdAt
    updatedAt
  }

  enum TaskSortFields {
    id
    title
    dueDate
    createdAt
    updatedAt
  }

  enum TaskStageSortFields {
    id
    title
    createdAt
    updatedAt
  }

  enum DealStageSortFields {
    id
    title
    createdAt
    updatedAt
  }

  enum EventSortFields {
    id
    title
    startDate
    endDate
    createdAt
    updatedAt
  }

  enum AuditSortFields {
    id
    action
    targetEntity
    createdAt
  }

  # Mutations
  input CreateOneCompanyInput {
    company: CompanyCreateInput!
  }

  input CompanyCreateInput {
    name: String!
    businessType: String
    companySize: CompanySize
    industry: String
    totalRevenue: Float
    salesOwnerId: ID
  }

  input UpdateOneCompanyInput {
    id: ID!
    update: CompanyUpdateInput!
  }

  input CompanyUpdateInput {
    name: String
    businessType: String
    companySize: CompanySize
    industry: String
    totalRevenue: Float
    salesOwnerId: ID
  }

  input DeleteOneCompanyInput {
    id: ID!
  }

  type CompanyDeleteResponse {
    id: ID
    name: String
  }

  # Auth
  type AuthResponse {
    accessToken: String!
    user: User!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  type Query {
    # Auth
    me: User

    # Users
    users(filter: UserFilter!, sorting: [UserSort!], paging: OffsetPaging): UserConnection!
    user(id: ID!): User

    # Companies
    companies(filter: CompanyFilter!, sorting: [CompanySort!], paging: OffsetPaging): CompanyConnection!
    company(id: ID!): Company

    # Contacts
    contacts(filter: ContactFilter!, sorting: [ContactSort!], paging: OffsetPaging): ContactConnection!
    contact(id: ID!): Contact

    # Deals
    deals(filter: DealFilter!, sorting: [DealSort!], paging: OffsetPaging): DealConnection!
    deal(id: ID!): Deal

    # Deal Stages
    dealStages(filter: DealStageFilter!, sorting: [DealStageSort!], paging: OffsetPaging): DealStageConnection!
    dealStage(id: ID!): DealStage

    # Tasks
    tasks(filter: TaskFilter!, sorting: [TaskSort!], paging: OffsetPaging): TaskConnection!
    task(id: ID!): Task

    # Task Stages
    taskStages(filter: TaskStageFilter!, sorting: [TaskStageSort!], paging: OffsetPaging): TaskStageConnection!
    taskStage(id: ID!): TaskStage

    # Events
    events(filter: EventFilter!, sorting: [EventSort!], paging: OffsetPaging): EventConnection!
    event(id: ID!): Event

    # Audits
    audits(filter: AuditFilter!, sorting: [AuditSort!], paging: OffsetPaging): AuditConnection!
    audit(id: ID!): Audit
  }

  type Mutation {
    # Auth
    login(input: LoginInput!): AuthResponse!

    # Companies
    createOneCompany(input: CreateOneCompanyInput!): Company!
    updateOneCompany(input: UpdateOneCompanyInput!): Company!
    deleteOneCompany(input: DeleteOneCompanyInput!): CompanyDeleteResponse!
  }

  type Subscription {
    companyCreated: Company!
    companyUpdated: Company!
    companyDeleted: CompanyDeleteResponse!
  }
`;

// Helper functions
function applyPaging(array, paging) {
  const limit = paging?.limit || 10;
  const offset = paging?.offset || 0;
  return array.slice(offset, offset + limit);
}

function applyFilter(array, filter, type) {
  if (!filter) return array;

  return array.filter(item => {
    for (const [key, condition] of Object.entries(filter)) {
      if (key === 'and' || key === 'or') continue;

      const value = item[key];
      if (condition.eq && value !== condition.eq) return false;
      if (condition.neq && value === condition.neq) return false;
      if (condition.like && !value?.toLowerCase().includes(condition.like.toLowerCase())) return false;
      if (condition.in && !condition.in.includes(value)) return false;

      // Date comparisons
      if (condition.gte && new Date(value) < new Date(condition.gte)) return false;
      if (condition.lte && new Date(value) > new Date(condition.lte)) return false;
      if (condition.gt && new Date(value) <= new Date(condition.gt)) return false;
      if (condition.lt && new Date(value) >= new Date(condition.lt)) return false;
    }
    return true;
  });
}

function applySorting(array, sorting) {
  if (!sorting || !sorting.length) return array;

  return [...array].sort((a, b) => {
    for (const sort of sorting) {
      const { field, direction } = sort;
      const aVal = a[field];
      const bVal = b[field];

      if (aVal < bVal) return direction === 'ASC' ? -1 : 1;
      if (aVal > bVal) return direction === 'ASC' ? 1 : -1;
    }
    return 0;
  });
}

// Resolvers
const resolvers = {
  Query: {
    me: (_, args, context) => {
      const { token } = context;
      if (!token) return null;

      const userId = activeSessions.get(token);
      if (!userId) return null;

      return users.find(u => u.id === userId);
    },

    users: (_, { filter, sorting, paging }) => {
      let filtered = applyFilter(users, filter);
      let sorted = applySorting(filtered, sorting);
      let paginated = applyPaging(sorted, paging);

      return {
        nodes: paginated,
        totalCount: filtered.length,
        pageInfo: {
          hasNextPage: (paging?.offset || 0) + (paging?.limit || 10) < filtered.length,
          hasPreviousPage: (paging?.offset || 0) > 0
        }
      };
    },

    user: (_, { id }) => users.find(u => u.id === id),

    companies: (_, { filter, sorting, paging }) => {
      let filtered = applyFilter(companies, filter);
      let sorted = applySorting(filtered, sorting);
      let paginated = applyPaging(sorted, paging);

      return {
        nodes: paginated,
        totalCount: filtered.length,
        pageInfo: {
          hasNextPage: (paging?.offset || 0) + (paging?.limit || 10) < filtered.length,
          hasPreviousPage: (paging?.offset || 0) > 0
        }
      };
    },

    company: (_, { id }) => companies.find(c => c.id === id),

    contacts: (_, { filter, sorting, paging }) => {
      let filtered = applyFilter(contacts, filter);
      let sorted = applySorting(filtered, sorting);
      let paginated = applyPaging(sorted, paging);

      return {
        nodes: paginated,
        totalCount: filtered.length,
        pageInfo: {
          hasNextPage: (paging?.offset || 0) + (paging?.limit || 10) < filtered.length,
          hasPreviousPage: (paging?.offset || 0) > 0
        }
      };
    },

    contact: (_, { id }) => contacts.find(c => c.id === id),

    deals: (_, { filter, sorting, paging }) => {
      let filtered = applyFilter(deals, filter);
      let sorted = applySorting(filtered, sorting);
      let paginated = applyPaging(sorted, paging);

      return {
        nodes: paginated,
        totalCount: filtered.length,
        pageInfo: {
          hasNextPage: (paging?.offset || 0) + (paging?.limit || 10) < filtered.length,
          hasPreviousPage: (paging?.offset || 0) > 0
        }
      };
    },

    deal: (_, { id }) => deals.find(d => d.id === id),

    dealStages: (_, { filter, sorting, paging }) => {
      let filtered = applyFilter(dealStages, filter);
      let sorted = applySorting(filtered, sorting);
      let paginated = applyPaging(sorted, paging);

      return {
        nodes: paginated,
        totalCount: filtered.length,
        pageInfo: {
          hasNextPage: (paging?.offset || 0) + (paging?.limit || 10) < filtered.length,
          hasPreviousPage: (paging?.offset || 0) > 0
        }
      };
    },

    dealStage: (_, { id }) => dealStages.find(ds => ds.id === id),

    tasks: (_, { filter, sorting, paging }) => {
      let filtered = applyFilter(tasks, filter);
      let sorted = applySorting(filtered, sorting);
      let paginated = applyPaging(sorted, paging);

      return {
        nodes: paginated,
        totalCount: filtered.length,
        pageInfo: {
          hasNextPage: (paging?.offset || 0) + (paging?.limit || 10) < filtered.length,
          hasPreviousPage: (paging?.offset || 0) > 0
        }
      };
    },

    task: (_, { id }) => tasks.find(t => t.id === id),

    taskStages: (_, { filter, sorting, paging }) => {
      let filtered = applyFilter(taskStages, filter);
      let sorted = applySorting(filtered, sorting);
      let paginated = applyPaging(sorted, paging);

      return {
        nodes: paginated,
        totalCount: filtered.length,
        pageInfo: {
          hasNextPage: (paging?.offset || 0) + (paging?.limit || 10) < filtered.length,
          hasPreviousPage: (paging?.offset || 0) > 0
        }
      };
    },

    taskStage: (_, { id }) => taskStages.find(ts => ts.id === id),

    events: (_, { filter, sorting, paging }) => {
      let filtered = applyFilter(events, filter);
      let sorted = applySorting(filtered, sorting);
      let paginated = applyPaging(sorted, paging);

      return {
        nodes: paginated,
        totalCount: filtered.length,
        pageInfo: {
          hasNextPage: (paging?.offset || 0) + (paging?.limit || 10) < filtered.length,
          hasPreviousPage: (paging?.offset || 0) > 0
        }
      };
    },

    event: (_, { id }) => events.find(e => e.id === id),

    // Audits
    audits: (_, { filter, sorting, paging }) => {
      let filtered = applyFilter(audits, filter);
      let sorted = applySorting(filtered, sorting);
      let paginated = applyPaging(sorted, paging);
      return {
        nodes: paginated,
        totalCount: filtered.length,
        pageInfo: {
          hasNextPage: (paging?.offset || 0) + (paging?.limit || 10) < filtered.length,
          hasPreviousPage: (paging?.offset || 0) > 0
        }
      };
    },
    audit: (_, { id }) => audits.find(a => a.id === id),
  },

  Mutation: {
    login: (_, { input }) => {
      const user = users.find(u => u.email === input.email);
      if (!user) {
        throw new Error('User not found');
      }

      // For demo purposes, accept any password for existing users
      // In a real app, you'd validate the password hash
      if (!input.password) {
        throw new Error('Password is required');
      }

      // Generate a simple token (user ID based for demo)
      const accessToken = `token-${user.id}-${Date.now()}`;

      // Store the session
      activeSessions.set(accessToken, user.id);

      return {
        accessToken,
        user
      };
    },

    createOneCompany: (_, { input }) => {
      const newId = String(companies.length + 1);
      const newCompany = {
        id: newId,
        ...input.company,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      companies.push(newCompany);
      pubsub.publish('COMPANY_CREATED', { companyCreated: newCompany });

      return newCompany;
    },

    updateOneCompany: (_, { input }) => {
      const index = companies.findIndex(c => c.id === input.id);
      if (index === -1) throw new Error('Company not found');

      companies[index] = {
        ...companies[index],
        ...input.update,
        updatedAt: new Date().toISOString()
      };

      pubsub.publish('COMPANY_UPDATED', { companyUpdated: companies[index] });

      return companies[index];
    },

    deleteOneCompany: (_, { input }) => {
      const index = companies.findIndex(c => c.id === input.id);
      if (index === -1) throw new Error('Company not found');

      const deletedCompany = companies.splice(index, 1)[0];
      const deleteResponse = { id: deletedCompany.id, name: deletedCompany.name };

      pubsub.publish('COMPANY_DELETED', { companyDeleted: deleteResponse });

      return deleteResponse;
    }
  },

  Subscription: {
    companyCreated: {
      subscribe: () => pubsub.asyncIterator(['COMPANY_CREATED'])
    },
    companyUpdated: {
      subscribe: () => pubsub.asyncIterator(['COMPANY_UPDATED'])
    },
    companyDeleted: {
      subscribe: () => pubsub.asyncIterator(['COMPANY_DELETED'])
    }
  },

  // Field resolvers
  Company: {
    salesOwner: (company) => users.find(u => u.id === company.salesOwnerId),
    contacts: (company, { filter, sorting, paging }) => {
      let companyContacts = contacts.filter(c => c.companyId === company.id);
      let filtered = applyFilter(companyContacts, filter);
      let sorted = applySorting(filtered, sorting);
      let paginated = applyPaging(sorted, paging);

      return {
        nodes: paginated,
        totalCount: filtered.length,
        pageInfo: {
          hasNextPage: (paging?.offset || 0) + (paging?.limit || 10) < filtered.length,
          hasPreviousPage: (paging?.offset || 0) > 0
        }
      };
    },
    deals: (company, { filter, sorting, paging }) => {
      let companyDeals = deals.filter(d => d.companyId === company.id);
      let filtered = applyFilter(companyDeals, filter);
      let sorted = applySorting(filtered, sorting);
      let paginated = applyPaging(sorted, paging);

      return {
        nodes: paginated,
        totalCount: filtered.length,
        pageInfo: {
          hasNextPage: (paging?.offset || 0) + (paging?.limit || 10) < filtered.length,
          hasPreviousPage: (paging?.offset || 0) > 0
        }
      };
    },
    dealsAggregate: (company, { filter }) => {
      let companyDeals = deals.filter(d => d.companyId === company.id);
      let filtered = applyFilter(companyDeals, filter);

      const values = filtered.map(d => d.value);
      const sum = values.reduce((acc, val) => acc + val, 0);
      const count = values.length;
      const avg = count > 0 ? sum / count : 0;
      const min = count > 0 ? Math.min(...values) : 0;
      const max = count > 0 ? Math.max(...values) : 0;

      return [{
        sum: { value: sum },
        avg: { value: avg },
        count: { value: count },
        min: { value: min },
        max: { value: max }
      }];
    }
  },

  Contact: {
    company: (contact) => companies.find(c => c.id === contact.companyId),
    salesOwner: (contact) => users.find(u => u.id === contact.salesOwnerId),
    deals: (contact, { filter, sorting, paging }) => {
      let contactDeals = deals.filter(d => d.contactId === contact.id);
      let filtered = applyFilter(contactDeals, filter);
      let sorted = applySorting(filtered, sorting);
      let paginated = applyPaging(sorted, paging);

      return {
        nodes: paginated,
        totalCount: filtered.length,
        pageInfo: {
          hasNextPage: (paging?.offset || 0) + (paging?.limit || 10) < filtered.length,
          hasPreviousPage: (paging?.offset || 0) > 0
        }
      };
    }
  },

  Deal: {
    stage: (deal) => dealStages.find(ds => ds.id === deal.stageId),
    company: (deal) => companies.find(c => c.id === deal.companyId),
    contact: (deal) => contacts.find(c => c.id === deal.contactId),
    salesOwner: (deal) => users.find(u => u.id === deal.salesOwnerId)
  },

  DealStage: {
    deals: (dealStage, { filter, sorting, paging }) => {
      let stageDeals = deals.filter(d => d.stageId === dealStage.id);
      let filtered = applyFilter(stageDeals, filter);
      let sorted = applySorting(filtered, sorting);
      let paginated = applyPaging(sorted, paging);

      return {
        nodes: paginated,
        totalCount: filtered.length,
        pageInfo: {
          hasNextPage: (paging?.offset || 0) + (paging?.limit || 10) < filtered.length,
          hasPreviousPage: (paging?.offset || 0) > 0
        }
      };
    },
    dealsAggregate: (dealStage, { filter }) => {
      let stageDeals = deals.filter(d => d.stageId === dealStage.id);
      let filtered = applyFilter(stageDeals, filter);

      const values = filtered.map(d => d.value || 0);
      const sum = values.reduce((acc, val) => acc + val, 0);
      const avg = values.length > 0 ? sum / values.length : 0;
      const count = filtered.length;
      const min = values.length > 0 ? Math.min(...values) : 0;
      const max = values.length > 0 ? Math.max(...values) : 0;

      // Group deals by month/year for this stage
      const dealsByDate = {};
      filtered.forEach(deal => {
        const date = new Date(deal.createdAt);
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const key = `${year}-${month}`;

        if (!dealsByDate[key]) {
          dealsByDate[key] = {
            month,
            year,
            deals: [],
            sum: 0
          };
        }
        dealsByDate[key].deals.push(deal);
        dealsByDate[key].sum += deal.value || 0;
      });

      // Convert to array format expected by frontend
      return Object.values(dealsByDate).map(group => ({
        sum: { value: group.sum },
        avg: { value: group.deals.length > 0 ? group.sum / group.deals.length : 0 },
        count: { value: group.deals.length },
        min: { value: group.deals.length > 0 ? Math.min(...group.deals.map(d => d.value || 0)) : 0 },
        max: { value: group.deals.length > 0 ? Math.max(...group.deals.map(d => d.value || 0)) : 0 },
        groupBy: {
          closeDateMonth: group.month,
          closeDateYear: group.year
        }
      }));
    }
  },

  Task: {
    stage: (task) => taskStages.find(ts => ts.id === task.stageId),
    stageId: (task) => task.stageId,
    assignedTo: (task) => users.find(u => u.id === task.assignedToId),
    users: (task) => {
      // Return assigned user as an array for compatibility with frontend
      const assignedUser = users.find(u => u.id === task.assignedToId);
      return assignedUser ? [assignedUser] : [];
    },
    completed: (task) => task.completed || false
  },

  TaskStage: {
    tasks: (taskStage, { filter, sorting, paging }) => {
      let stageTasks = tasks.filter(t => t.stageId === taskStage.id);
      let filtered = applyFilter(stageTasks, filter);
      let sorted = applySorting(filtered, sorting);
      let paginated = applyPaging(sorted, paging);

      return {
        nodes: paginated,
        totalCount: filtered.length,
        pageInfo: {
          hasNextPage: (paging?.offset || 0) + (paging?.limit || 10) < filtered.length,
          hasPreviousPage: (paging?.offset || 0) > 0
        }
      };
    }
  },

  Event: {
    participants: (event) => users.filter(u => event.participantIds.includes(u.id))
  },

  Audit: {
    user: (audit) => users.find(u => u.id === audit.userId)
  }
};

async function startServer() {
  const app = express();

  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    credentials: true
  }));

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      const token = req.headers.authorization?.replace('Bearer ', '');
      return { token };
    }
  });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });

  const httpServer = app.listen(4000, () => {
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
  });
}

startServer().catch(error => {
  console.error('Error starting server:', error);
});