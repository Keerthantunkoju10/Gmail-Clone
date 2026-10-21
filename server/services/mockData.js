const DEMO_ACCOUNTS = [
  {
    id: 'demo-work',
    email: 'alex.work@gmail.com',
    name: 'Alex Work',
    color: { name: 'Blue', hex: '#1A73E8', bg: '#E8F0FE', text: '#1967D2' },
    isDefault: true,
    isDemo: true,
    initial: 'W',
    unreadCount: 2,
  },
  {
    id: 'demo-personal',
    email: 'alex.personal@gmail.com',
    name: 'Alex Personal',
    color: { name: 'Green', hex: '#34A853', bg: '#E6F4EA', text: '#137333' },
    isDefault: false,
    isDemo: true,
    initial: 'P',
    unreadCount: 1,
  },
];

const DEMO_MESSAGES = [
  {
    id: 'demo-msg-1',
    uid: 101,
    folder: 'inbox',
    subject: 'Welcome to your Interlinked Gmail Clone! 🚀',
    from: { name: 'Google Cloud Team', address: 'cloud-updates@google.com' },
    to: { name: 'Alex Work', address: 'alex.work@gmail.com' },
    date: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    snippet: 'Manage all your Gmail accounts in one unified inbox with 16-character Google App Passwords...',
    isStarred: true,
    isRead: false,
    hasAttachments: false,
    accountId: 'demo-work',
    accountEmail: 'alex.work@gmail.com',
    accountName: 'Alex Work',
    accountColor: { name: 'Blue', hex: '#1A73E8', bg: '#E8F0FE', text: '#1967D2' },
    html: `
      <div style="font-family: Roboto, Arial, sans-serif; max-width: 650px; color: #202124; line-height: 1.6;">
        <h2 style="color: #1a73e8; margin-bottom: 8px;">Welcome to your Interlinked Gmail Clone</h2>
        <p>This web client connects seamlessly to Gmail using <strong>16-digit Google App Passwords</strong> over secure IMAP & SMTP.</p>
        
        <div style="background: #f8f9fa; border-left: 4px solid #1a73e8; padding: 14px 18px; margin: 20px 0; border-radius: 4px;">
          <h4 style="margin: 0 0 8px 0; color: #1a73e8;">Key Features Ready for You:</h4>
          <ul style="margin: 0; padding-left: 20px;">
            <li><strong>Unified Inbox:</strong> View combined emails from all linked Gmail accounts with account badges.</li>
            <li><strong>Instant Account Switcher:</strong> Switch focus to any specific Gmail account at any time.</li>
            <li><strong>16-Digit App Password Support:</strong> Auto-formatted input (<code>xxxx xxxx xxxx xxxx</code>) with live credential verification.</li>
            <li><strong>Live Send & Receive:</strong> Real IMAP message retrieval and SMTP email delivery with attachments.</li>
          </ul>
        </div>

        <p>Click <strong>"Add Account"</strong> in the top right account switcher to link your actual Gmail accounts!</p>
        <p style="color: #5f6368; font-size: 13px; margin-top: 30px;">Best regards,<br/>The Gmail Clone Team</p>
      </div>
    `,
  },
  {
    id: 'demo-msg-2',
    uid: 102,
    folder: 'inbox',
    subject: 'Project roadmap review: Q4 sprint updates and milestones',
    from: { name: 'Sarah Lin', address: 'sarah.lin@techcorp.io' },
    to: { name: 'Alex Work', address: 'alex.work@gmail.com' },
    date: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    snippet: 'Hey Alex, attached is the updated sprint retrospective document. Let me know if you want any revisions before tomorrow...',
    isStarred: false,
    isRead: false,
    hasAttachments: true,
    accountId: 'demo-work',
    accountEmail: 'alex.work@gmail.com',
    accountName: 'Alex Work',
    accountColor: { name: 'Blue', hex: '#1A73E8', bg: '#E8F0FE', text: '#1967D2' },
    html: `
      <div style="font-family: Roboto, Arial, sans-serif; line-height: 1.6; color: #202124;">
        <p>Hi Alex,</p>
        <p>Attached is the updated sprint retrospective document for our Q4 product release. Highlights include:</p>
        <ul>
          <li>Faster data synchronization and live cache invalidation</li>
          <li>New security hardening for IMAP connections</li>
          <li>Refreshed Material 3 UI components</li>
        </ul>
        <p>Let me know if you want any revisions before tomorrow's team sync.</p>
        <p>Cheers,<br/>Sarah</p>
      </div>
    `,
    attachments: [
      { filename: 'Q4_Roadmap_Final.pdf', size: 142000, contentType: 'application/pdf' },
    ],
  },
  {
    id: 'demo-msg-3',
    uid: 201,
    folder: 'inbox',
    subject: 'Weekend hiking plans at Mount Rainier 🌲',
    from: { name: 'Marcus Brody', address: 'marcus.brody@outdoors.org' },
    to: { name: 'Alex Personal', address: 'alex.personal@gmail.com' },
    date: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
    snippet: 'Hey, the weather forecast for Saturday looks sunny with crisp 62°F. Trails are open and we have permits ready...',
    isStarred: true,
    isRead: true,
    hasAttachments: false,
    accountId: 'demo-personal',
    accountEmail: 'alex.personal@gmail.com',
    accountName: 'Alex Personal',
    accountColor: { name: 'Green', hex: '#34A853', bg: '#E6F4EA', text: '#137333' },
    html: `
      <div style="font-family: Roboto, Arial, sans-serif; line-height: 1.6; color: #202124;">
        <p>Hey Alex,</p>
        <p>The weather forecast for Saturday looks sunny with crisp 62°F. Trails are fully open and we have the morning permits ready.</p>
        <p>Let's meet at the north trailhead at 7:30 AM so we catch the morning light over the ridge. Bring your camera!</p>
        <p>Talk soon,<br/>Marcus</p>
      </div>
    `,
  },
  {
    id: 'demo-msg-4',
    uid: 202,
    folder: 'inbox',
    subject: 'Your order has shipped! Tracking number: 9400 1118 9956',
    from: { name: 'SoundTech Gear', address: 'shipping@soundtechgear.com' },
    to: { name: 'Alex Personal', address: 'alex.personal@gmail.com' },
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    snippet: 'Great news! Your noise-canceling studio headphones are on the way. Estimated delivery date: Thursday by 5 PM...',
    isStarred: false,
    isRead: true,
    hasAttachments: false,
    accountId: 'demo-personal',
    accountEmail: 'alex.personal@gmail.com',
    accountName: 'Alex Personal',
    accountColor: { name: 'Green', hex: '#34A853', bg: '#E6F4EA', text: '#137333' },
    html: `
      <div style="font-family: Roboto, Arial, sans-serif; line-height: 1.6; color: #202124;">
        <h3 style="color: #34A853;">Your SoundTech package is on the way!</h3>
        <p>Tracking Number: <strong>9400 1118 9956 4210 0341</strong></p>
        <p>Expected delivery: Thursday before 5:00 PM.</p>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 16px 0;" />
        <p style="color: #70757a; font-size: 13px;">Thank you for shopping with SoundTech Gear.</p>
      </div>
    `,
  },
  {
    id: 'demo-msg-5',
    uid: 103,
    folder: 'sent',
    subject: 'Re: API Architecture & IMAP Connection Pooling Proposal',
    from: { name: 'Alex Work', address: 'alex.work@gmail.com' },
    to: { name: 'Engineering Leads', address: 'eng-leads@techcorp.io' },
    date: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    snippet: 'Thanks everyone. I have reviewed the connection pooling proposal and approved the pull request...',
    isStarred: false,
    isRead: true,
    hasAttachments: false,
    accountId: 'demo-work',
    accountEmail: 'alex.work@gmail.com',
    accountName: 'Alex Work',
    accountColor: { name: 'Blue', hex: '#1A73E8', bg: '#E8F0FE', text: '#1967D2' },
    html: `
      <div style="font-family: Roboto, Arial, sans-serif; line-height: 1.6; color: #202124;">
        <p>Hi team,</p>
        <p>Thanks everyone. I have reviewed the connection pooling proposal and approved the pull request. We should see significant speedups on mail downloads.</p>
        <p>Regards,<br/>Alex</p>
      </div>
    `,
  },
];

module.exports = {
  DEMO_ACCOUNTS,
  DEMO_MESSAGES,
};
