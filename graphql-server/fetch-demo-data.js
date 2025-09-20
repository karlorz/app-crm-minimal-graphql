const fetch = require('node-fetch');
const fs = require('fs');

const REMOTE_API = 'https://api.crm.refine.dev/graphql';

// GraphQL queries to fetch all demo data
const queries = {
  users: `
    query {
      users(filter: {}, sorting: [], paging: {limit: 100}) {
        nodes {
          id
          name
          email
          avatarUrl
          jobTitle
          phone
          timezone
          role
          createdAt
          updatedAt
        }
      }
    }
  `,

  companies: `
    query {
      companies(filter: {}, sorting: [], paging: {limit: 100}) {
        nodes {
          id
          name
          avatarUrl
          businessType
          companySize
          industry
          totalRevenue
          salesOwner {
            id
          }
          createdAt
          updatedAt
        }
      }
    }
  `,

  contacts: `
    query {
      contacts(filter: {}, sorting: [], paging: {limit: 100}) {
        nodes {
          id
          name
          email
          avatarUrl
          jobTitle
          phone
          stage
          status
          company {
            id
          }
          salesOwner {
            id
          }
          createdAt
          updatedAt
        }
      }
    }
  `,

  dealStages: `
    query {
      dealStages(filter: {}, sorting: [], paging: {limit: 50}) {
        nodes {
          id
          title
          createdAt
          updatedAt
        }
      }
    }
  `,

  deals: `
    query {
      deals(filter: {}, sorting: [], paging: {limit: 100}) {
        nodes {
          id
          title
          value
          stage {
            id
          }
          company {
            id
          }
          contact {
            id
          }
          salesOwner {
            id
          }
          createdAt
          updatedAt
        }
      }
    }
  `,

  taskStages: `
    query {
      taskStages(filter: {}, sorting: [], paging: {limit: 50}) {
        nodes {
          id
          title
          createdAt
          updatedAt
        }
      }
    }
  `,

  tasks: `
    query {
      tasks(filter: {}, sorting: [], paging: {limit: 100}) {
        nodes {
          id
          title
          description
          dueDate
          stage {
            id
          }
          assignedTo {
            id
          }
          createdAt
          updatedAt
        }
      }
    }
  `
};

async function fetchGraphQL(query, variables = {}, accessToken = null) {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(REMOTE_API, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables })
    });

    const result = await response.json();

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return null;
    }

    return result.data;
  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
}

async function authenticate() {
  console.log('🔐 Authenticating with remote API...');

  const loginMutation = `
    mutation Login($email: String!) {
      login(loginInput: {
        email: $email
      }) {
        accessToken
        user {
          id
          name
          email
        }
      }
    }
  `;

  const result = await fetchGraphQL(loginMutation, {
    email: 'john@refine.dev'
  });

  if (result && result.login) {
    console.log('✅ Authentication successful');
    return result.login.accessToken;
  } else {
    console.error('❌ Authentication failed');
    return null;
  }
}

async function fetchAllData() {
  console.log('🚀 Fetching demo data from remote CRM API...');

  const data = {};

  // Try to fetch users first (this worked before without auth)
  console.log(`📡 Fetching users...`);
  const usersResult = await fetchGraphQL(queries.users);
  if (usersResult && usersResult.users) {
    data.users = usersResult.users.nodes;
    console.log(`✅ Fetched ${data.users.length} users`);
  } else {
    console.log(`❌ Failed to fetch users`);
    data.users = [];
  }

  // Try to authenticate for other resources
  const accessToken = await authenticate();

  // Fetch other resources (with or without auth token)
  for (const [key, query] of Object.entries(queries)) {
    if (key === 'users') continue; // Already fetched

    console.log(`📡 Fetching ${key}...`);
    const result = await fetchGraphQL(query, {}, accessToken);

    if (result && result[key]) {
      data[key] = result[key].nodes;
      console.log(`✅ Fetched ${data[key].length} ${key}`);
    } else {
      console.log(`❌ Failed to fetch ${key}, will use generated data`);
      data[key] = [];
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Transform the data for our local server format
  const transformedData = transformData(data);

  // Save to file
  fs.writeFileSync('./demo-data.json', JSON.stringify(transformedData, null, 2));
  console.log('💾 Saved demo data to demo-data.json');

  return transformedData;
}

function transformData(data) {
  // Use real user data if available, otherwise generate mock data
  const users = data.users.length > 0 ? data.users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    jobTitle: user.jobTitle,
    phone: user.phone,
    timezone: user.timezone,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  })) : generateMockUsers();

  // Generate companies if not available
  const companies = data.companies.length > 0 ? data.companies.map(company => ({
    id: company.id,
    name: company.name,
    avatarUrl: company.avatarUrl,
    businessType: company.businessType,
    companySize: company.companySize,
    industry: company.industry,
    totalRevenue: company.totalRevenue,
    salesOwnerId: company.salesOwner?.id,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt
  })) : generateMockCompanies(users);

  // Generate contacts if not available
  const contacts = data.contacts.length > 0 ? data.contacts.map(contact => ({
    id: contact.id,
    name: contact.name,
    email: contact.email,
    avatarUrl: contact.avatarUrl,
    jobTitle: contact.jobTitle,
    phone: contact.phone,
    stage: contact.stage,
    status: contact.status,
    companyId: contact.company?.id,
    salesOwnerId: contact.salesOwner?.id,
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt
  })) : generateMockContacts(companies, users);

  // Generate deal stages if not available
  const dealStages = data.dealStages.length > 0 ? data.dealStages.map(stage => ({
    id: stage.id,
    title: stage.title,
    createdAt: stage.createdAt,
    updatedAt: stage.updatedAt
  })) : generateMockDealStages();

  // Generate deals if not available
  const deals = data.deals.length > 0 ? data.deals.map(deal => ({
    id: deal.id,
    title: deal.title,
    value: deal.value,
    stageId: deal.stage?.id,
    companyId: deal.company?.id,
    contactId: deal.contact?.id,
    salesOwnerId: deal.salesOwner?.id,
    createdAt: deal.createdAt,
    updatedAt: deal.updatedAt
  })) : generateMockDeals(companies, contacts, users, dealStages);

  // Generate task stages if not available
  const taskStages = data.taskStages.length > 0 ? data.taskStages.map(stage => ({
    id: stage.id,
    title: stage.title,
    createdAt: stage.createdAt,
    updatedAt: stage.updatedAt
  })) : generateMockTaskStages();

  // Generate tasks if not available
  const tasks = data.tasks.length > 0 ? data.tasks.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    stageId: task.stage?.id,
    assignedToId: task.assignedTo?.id,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  })) : generateMockTasks(users, taskStages);

  const transformed = {
    users,
    companies,
    contacts,
    dealStages,
    deals,
    taskStages,
    tasks
  };

  // Generate events based on the companies and contacts data
  transformed.events = generateEvents(companies, contacts, users);

  return transformed;
}

function generateMockUsers() {
  return [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@refine.dev',
      avatarUrl: 'https://i.pravatar.cc/128?img=1',
      jobTitle: 'Sales Manager',
      phone: '+1 (555) 123-4567',
      timezone: 'America/New_York',
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@refine.dev',
      avatarUrl: 'https://i.pravatar.cc/128?img=2',
      jobTitle: 'Account Executive',
      phone: '+1 (555) 987-6543',
      timezone: 'America/Los_Angeles',
      role: 'USER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

function generateMockCompanies(users) {
  return [
    {
      id: '1',
      name: 'Acme Corporation',
      avatarUrl: 'https://via.placeholder.com/50x50/1890ff/ffffff?text=AC',
      businessType: 'B2B',
      companySize: 'ENTERPRISE',
      industry: 'Technology',
      totalRevenue: 5000000,
      salesOwnerId: users[0]?.id || '1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'TechStart Inc',
      avatarUrl: 'https://via.placeholder.com/50x50/52c41a/ffffff?text=TS',
      businessType: 'B2B',
      companySize: 'SMALL',
      industry: 'Technology',
      totalRevenue: 1200000,
      salesOwnerId: users[1]?.id || '2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

function generateMockContacts(companies, users) {
  return [
    {
      id: '1',
      name: 'Bob Johnson',
      email: 'bob@acme.com',
      avatarUrl: 'https://i.pravatar.cc/128?img=3',
      jobTitle: 'CTO',
      phone: '+1 (555) 111-2222',
      stage: 'QUALIFIED',
      status: 'ACTIVE',
      companyId: companies[0]?.id || '1',
      salesOwnerId: users[0]?.id || '1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Alice Brown',
      email: 'alice@techstart.com',
      avatarUrl: 'https://i.pravatar.cc/128?img=4',
      jobTitle: 'CEO',
      phone: '+1 (555) 333-4444',
      stage: 'OPPORTUNITY',
      status: 'ACTIVE',
      companyId: companies[1]?.id || '2',
      salesOwnerId: users[1]?.id || '2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

function generateMockDealStages() {
  return [
    {
      id: '1',
      title: 'LEAD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      title: 'QUALIFIED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '3',
      title: 'PROPOSAL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '4',
      title: 'WON',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

function generateMockDeals(companies, contacts, users, dealStages) {
  return [
    {
      id: '1',
      title: 'Enterprise License for Acme Corp',
      value: 150000,
      stageId: dealStages[2]?.id || '3',
      companyId: companies[0]?.id || '1',
      contactId: contacts[0]?.id || '1',
      salesOwnerId: users[0]?.id || '1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Startup Package for TechStart',
      value: 25000,
      stageId: dealStages[1]?.id || '2',
      companyId: companies[1]?.id || '2',
      contactId: contacts[1]?.id || '2',
      salesOwnerId: users[1]?.id || '2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

function generateMockTaskStages() {
  return [
    {
      id: '1',
      title: 'TODO',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      title: 'IN_PROGRESS',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '3',
      title: 'DONE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

function generateMockTasks(users, taskStages) {
  return [
    {
      id: '1',
      title: 'Follow up with Acme Corp',
      description: 'Schedule a demo call to discuss their requirements',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      completed: false,
      stageId: taskStages[0]?.id || '1',
      assignedToId: users[0]?.id || '1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Prepare proposal for TechStart',
      description: 'Create a custom proposal based on their startup needs',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      completed: false,
      stageId: taskStages[1]?.id || '2',
      assignedToId: users[1]?.id || '2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '3',
      title: 'Send contract to Acme Corp',
      description: 'Review and send final contract documents',
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      completed: true,
      stageId: taskStages[2]?.id || '3',
      assignedToId: users[0]?.id || '1',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

function generateEvents(companies, contacts, users) {
  const events = [];
  const eventTitles = [
    'Demo Call',
    'Product Presentation',
    'Contract Review',
    'Sales Meeting',
    'Proposal Discussion',
    'Follow-up Call',
    'Quarterly Review',
    'Strategy Session',
    'Client Check-in',
    'Progress Update'
  ];

  const colors = ['#1890ff', '#52c41a', '#722ed1', '#eb2f96', '#fa8c16', '#13c2c2', '#f5222d', '#a0d911'];

  // Generate events for the next 30 days
  for (let i = 0; i < Math.min(20, companies.length * 2); i++) {
    const company = companies[i % companies.length];
    const contact = contacts.find(c => c.companyId === company.id) || contacts[i % contacts.length];
    const user = users[i % users.length];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30));
    startDate.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));

    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + 30 + Math.floor(Math.random() * 90));

    events.push({
      id: String(i + 1),
      title: `${eventTitles[i % eventTitles.length]} with ${company.name}`,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      color: colors[i % colors.length],
      participantIds: [user.id],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  return events;
}

// Run the script
if (require.main === module) {
  fetchAllData()
    .then(data => {
      console.log('📊 Data Summary:');
      console.log(`👥 Users: ${data.users.length}`);
      console.log(`🏢 Companies: ${data.companies.length}`);
      console.log(`👤 Contacts: ${data.contacts.length}`);
      console.log(`📈 Deals: ${data.deals.length}`);
      console.log(`📋 Tasks: ${data.tasks.length}`);
      console.log(`📅 Events: ${data.events.length}`);
      console.log('✅ Demo data ready for import!');
    })
    .catch(error => {
      console.error('❌ Error fetching data:', error);
    });
}

module.exports = { fetchAllData };