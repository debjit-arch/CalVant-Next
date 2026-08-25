//C:\Users\ak192\Downloads\CalVant-Next-master (3)\CalVant-Next-master\src\modules\admin\components\Toolintegrations\providerMeta.js


import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import WorkspacesIcon from '@mui/icons-material/Workspaces';
import WindowIcon from '@mui/icons-material/Window';
import BadgeIcon from '@mui/icons-material/Badge';
import LockIcon from '@mui/icons-material/Lock';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import GppMaybeIcon from '@mui/icons-material/GppMaybe';
import PhishingIcon from '@mui/icons-material/Phishing';
import BugReportIcon from '@mui/icons-material/BugReport';
import ShieldIcon from '@mui/icons-material/Shield';
import ArticleIcon from '@mui/icons-material/Article';
import VisibilityIcon from '@mui/icons-material/Visibility';
// `logoUrl` can be either:
// - a local path served from /public, e.g. '/logos/aws.svg' (recommended — see note below)
// - a full remote URL, e.g. 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/aws.svg'
// - '' / undefined, in which case ProviderCard falls back to the MUI `Icon`
//
// Recommended: download the real SVG once (from dashboardicons.com or the
// vendor's own brand/press page) and drop it in public/logos/<key>.svg, then
// just set logoUrl: '/logos/<key>.svg' below. That avoids depending on a
// third-party CDN staying online/unchanged for a product your clients rely on.
export const BUILT_IN_PROVIDERS = [
{
key: 'aws',
label: 'Amazon Web Services',
shortLabel: 'AWS',
accent: '#FF9900',
Icon: CloudQueueIcon,
logoUrl: '/logos/aws.svg',
description: 'IAM, S3, CloudTrail, GuardDuty',
},
{
key: 'gws',
label: 'Google Workspace',
shortLabel: 'Google WS',
accent: '#4285F4',
Icon: WorkspacesIcon,
logoUrl: '/logos/google-workspace.svg',
description: 'Admin SDK, Drive, Audit Logs',
},
{
key: 'm365',
label: 'Microsoft 365',
shortLabel: 'M365',
accent: '#0078D4',
Icon: WindowIcon,
logoUrl: '/logos/microsoft-365.svg',
description: 'Azure AD, SharePoint, Defender',
},
{
key: 'keka',
label: 'Keka HR',
shortLabel: 'Keka',
accent: '#E84C3D',
Icon: BadgeIcon,
logoUrl: '/logos/keka.svg',
description: 'Core HR, Leave, Attendance',
},
{
key: 'vault',
label: 'HashiCorp Vault',
shortLabel: 'Vault',
accent: '#000000',
Icon: LockIcon,
logoUrl: '/logos/hashicorp-vault.svg',
description: 'Secrets, dynamic credentials, PKI',
},
{
key: 'jumpcloud',
configKey: 'jumpCloud',
label: 'JumpCloud',
shortLabel: 'JumpCloud',
accent: '#14283D',
Icon: DevicesOtherIcon,
logoUrl: '/logos/jumpcloud.svg',
description: 'Device & identity management',
},
{
key: 'otx',
label: 'OTX AlienVault',
shortLabel: 'OTX',
accent: '#00A8E0',
Icon: GppMaybeIcon,
logoUrl: '/logos/otx-alienvault.svg',
description: 'Threat intelligence feed',
},
{
key: 'gophish',
label: 'GoPhish',
shortLabel: 'GoPhish',
accent: '#5D4E8C',
Icon: PhishingIcon,
logoUrl: '/logos/gophish.svg',
description: 'Phishing simulation & training',
},
{
key: 'snyk',
label: 'Snyk',
shortLabel: 'Snyk',
accent: '#4C4A73',
Icon: BugReportIcon,
logoUrl: '/logos/snyk.svg',
description: 'Code & dependency scanning',
},
{
key: 'cloudflare',
label: 'Cloudflare',
shortLabel: 'Cloudflare',
accent: '#F38020',
Icon: ShieldIcon,
logoUrl: '/logos/cloudflare.svg',
description: 'WAF, firewall, TLS enforcement',
},
{
key: 'notion',
label: 'Notion',
shortLabel: 'Notion',
accent: '#000000',
Icon: ArticleIcon,
logoUrl: '/logos/notion.svg',
description: 'Policy & documentation tracking',
},
{
key: 'wazuh',
label: 'Wazuh',
shortLabel: 'Wazuh',
accent: '#3253DC',
Icon: VisibilityIcon,
logoUrl: '/logos/wazuh.svg',
description: 'Vulnerability & log monitoring',
},
{
key: 'confluence',
label: 'Confluence',
description: 'Policy & documentation tracking',
Icon: ShieldIcon, // or whatever fallback icon import you use elsewhere
logoUrl: '/logos/confluence.svg',
accent: '#172B4D',
},
{
key: 'pfsense',
label: 'pfSense',
description: 'Firewall rules & network segmentation',
Icon: VisibilityIcon, // fallback icon
logoUrl: '/logos/pfsense.svg',
accent: '#212121',
},
{
key: 'crowdstrike',
label: 'CrowdStrike Falcon',
accent: '#E01F27',
description: 'Endpoint protection, vulnerability exposure, and threat detections.',
Icon: ShieldIcon,
logoUrl: '/logos/crowdstrike.svg',
},
{
key: 'owaspzap',
label: 'OWASP ZAP',
accent: '#4B0082',
description: 'Dynamic application security testing (DAST) findings by risk.',
Icon: BugReportIcon,
logoUrl: '/logos/owaspzap.svg', // optional — falls back to Icon if missing
configKey: 'owaspZap',
},
{
key: 'keycloak',
label: 'Keycloak',
description: 'Open-source identity & access management',
Icon: ShieldIcon, // or whatever fallback icon import you use elsewhere — SecurityIcon, LockIcon, etc.
logoUrl: '/logos/keycloak.svg',
accent: '#4D4D4D',
},
{
key: 'paloalto',
configKey: 'paloAlto',
label: 'Palo Alto Networks',
shortLabel: 'Palo Alto',
description: 'Next-gen firewall & threat prevention',
Icon: ShieldIcon,
logoUrl: '/logos/paloalto.svg',
accent: '#FA582D',
},
{
key: 'graylog',
label: 'Graylog',
accent: '#FF3633',
description: 'Centralized log management and SIEM',
Icon: BugReportIcon, // import from '@mui/icons-material/ManageSearch'
logoUrl: '/logos/graylog.svg', // optional, falls back to Icon if missing
},
{
key: 'bitwarden',
label: 'Bitwarden Teams',
accent: '#175DDC',
description: 'Team password vault and secrets management',
Icon: ShieldIcon, // import from '@mui/icons-material/VpnKey'
logoUrl: '/logos/bitwarden.svg',
},
{
key: 'jamfpro',
label: 'Jamf Pro',
accent: '#26A055',
description: 'MDM — Mobile & Endpoint Device Management',
Icon: DevicesOtherIcon,
logoUrl: '/logos/jamf.svg',
},
{
key: 'misp',
label: 'MISP Threat Intelligence',
accent: '#A020F0',
description: 'Threat intelligence events and security feeds sharing platform',
Icon: BugReportIcon,
logoUrl: '/logos/misp.svg',
},
{
  key: 'frigate',
  label: 'Frigate NVR',
  description: 'AI-powered local network video recording',
  Icon: VisibilityIcon, 
  logoUrl: '/logos/frigate.svg',
  accent: '#06B6D4',
},
{
  key: 'verkada',
  label: 'Verkada',
  shortLabel: 'Verkada',
  accent: '#000000',
  Icon: VisibilityIcon,
  logoUrl: '/logos/verkada.svg',
  description: 'Cloud-based physical security, video security, and access control.',
},
{
  key: 'auth0',
  label: 'Auth0',
  shortLabel: 'Auth0',
  accent: '#EB5424',
  description: 'Authentication & authorization as a service',
  Icon: ShieldIcon,
  logoUrl: '/logos/auth0.svg',
},
{
  key: 'onelogin',
  label: 'OneLogin',
  shortLabel: 'OneLogin',
  accent: '#0D72B9',
  description: 'Identity & Access Management',
  Icon: ShieldIcon,
  logoUrl: '/logos/onelogin.svg',
},
{
  key: 'fortigate',
  label: 'FortiGate',
  shortLabel: 'FortiGate',
  accent: '#EE3124',
  description: 'Next-Generation Firewall & Security',
  Icon: ShieldIcon,
  logoUrl: '/logos/fortigate.svg',
},
// {
//   key: 'intune',
//   label: 'Microsoft Intune',
//   shortLabel: 'Intune',
//   accent: '#0078D4',
//   description: 'Endpoint & Mobile Device Management',
//   Icon: DevicesOtherIcon,
//   logoUrl: 'https://logo.clearbit.com/microsoft.com',
// },
{
  key: 'proofpoint',
  label: 'Proofpoint',
  shortLabel: 'Proofpoint',
  accent: '#007ABF',
  description: 'Email Security & Protection',
  Icon: ShieldIcon,
  logoUrl: '/logos/proofpoint.svg',
},
{
  key: 'slack',
  label: 'Slack',
  shortLabel: 'Slack',
  accent: '#4A154B',
  description: 'Team Communication & Alerts',
  Icon: ArticleIcon,
  logoUrl: '/logos/slack.svg',
},
{
  key: 'sonarqube',
  label: 'SonarQube',
  shortLabel: 'SonarQube',
  accent: '#4E9BCD',
  description: 'Code Quality & Security Analysis',
  Icon: BugReportIcon,
  logoUrl: '/logos/sonarqube.svg',
},
{
  key: 'splunk',
  label: 'Splunk',
  shortLabel: 'Splunk',
  accent: '#000000',
  description: 'Data Analytics & SIEM',
  Icon: VisibilityIcon,
  logoUrl: '/logos/splunk.svg',
},
{
  key: 'onepassword',
  configKey: 'onepassword',
  label: '1Password',
  shortLabel: '1Password',
  accent: '#0572EC',
  description: 'Secrets vault, sign-in & audit events',
  Icon: ShieldIcon, // Using ShieldIcon as fallback because VpnKeyIcon is commented out at the top
  logoUrl: '/logos/1password.svg',
},
{
  key: 'servicenow',
  label: 'ServiceNow',
  shortLabel: 'ServiceNow',
  accent: '#81B5A1',
  description: 'ITSM, incident & policy tracking',
  Icon: ArticleIcon,
  logoUrl: '/logos/servicenow.svg',
},
{
  key: 'jsm',
  label: 'Jira Service Management',
  shortLabel: 'Jira SM',
  accent: '#2684FF',
  description: 'Helpdesk, incidents & change management',
  Icon: ArticleIcon,
  logoUrl: '/logos/jira.svg',
},
{
  key: 'hexnode',
  label: 'Hexnode',
  shortLabel: 'Hexnode',
  accent: '#2A2A2A',
  description: 'MDM — Mobile & Endpoint Device Management',
  Icon: DevicesOtherIcon,
  logoUrl: '/logos/hexnode.svg',
},
{
  key: 'gitlab',
  label: 'GitLab',
  shortLabel: 'GitLab',
  accent: '#FC6D26',
  description: 'Source code management & CI/CD pipeline security',
  Icon: ShieldIcon,
  logoUrl: '/logos/gitlab.svg',
},
{
  key: 'okta',
  label: 'Okta',
  shortLabel: 'Okta',
  accent: '#007DC1',
  description: 'Identity & Access Management',
  Icon: ShieldIcon,
  logoUrl: '/logos/okta.svg',
},
{
  key: 'datadog',
  label: 'Datadog',
  shortLabel: 'Datadog',
  accent: '#632CA6',
  description: 'Cloud monitoring & Security',
  Icon: ShieldIcon,
  logoUrl: '/logos/datadog.svg',
}
// {
// key: 'teams',
// label: 'Microsoft Teams',
// accent: '#6264A7',
// description: 'Compliance sync alerts via Teams channel',
// Icon: ForumIcon, // import from '@mui/icons-material/Forum'
// logoUrl: '/logos/teams.svg',
// },
];
export const TYPE_COLORS = {
CLOUD: 'primary', HRMS: 'secondary', IAM: 'warning',
TICKETING: 'info', COMMUNICATION: 'success', CUSTOM: 'default',
};





