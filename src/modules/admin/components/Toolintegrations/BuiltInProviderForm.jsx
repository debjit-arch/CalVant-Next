// // src/modules/admin/components/Integrations/BuiltInProviderForm.jsx
// import { useState } from 'react';
// import {
//   Box, TextField, Button, CircularProgress,
//   Alert, Typography, Divider
// } from '@mui/material';
// import CheckCircleIcon from '@mui/icons-material/CheckCircle';
// import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
// import WifiTetheringIcon from '@mui/icons-material/WifiTethering';
// import LinkOffIcon from '@mui/icons-material/LinkOff';
// import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';

// const PROVIDERS = {
//   aws: {
//     label: 'Amazon Web Services',
//     accent: '#FF9900',
//     note: 'Create a cross-account IAM role that trusts CalVant, then paste the Role ARN. Your credentials are encrypted with AES-256-GCM before storage — never stored in plaintext.',
//     fields: [
//       { key: 'accountId',       label: 'Account ID',                   secret: false },
//       { key: 'region',          label: 'Region',                       secret: false, placeholder: 'ap-south-1' },
//       { key: 'roleArn',         label: 'Role ARN',                     secret: true,  placeholder: 'arn:aws:iam::123456789012:role/CalVantReadOnly' },
//       { key: 'evidenceBuckets', label: 'Evidence Buckets (comma-separated)', secret: false, placeholder: 'bucket-1, bucket-2' },
//     ],
//   },
//   gws: {
//     label: 'Google Workspace',
//     accent: '#4285F4',
//     note: 'Create a GCP service account with domain-wide delegation enabled, then paste the full JSON key below.',
//     fields: [
//       { key: 'domain',             label: 'Domain',               secret: false, placeholder: 'yourcompany.com' },
//       { key: 'customerId',         label: 'Customer ID',          secret: false, placeholder: 'C0xxxxxxx' },
//       { key: 'adminUser',          label: 'Admin User Email',     secret: false, placeholder: 'admin@yourcompany.com' },
//       { key: 'serviceAccountJson', label: 'Service Account JSON', secret: true,  multiline: true },
//     ],
//   },
//   m365: {
//     label: 'Microsoft 365',
//     accent: '#0078D4',
//     note: 'Register an app in Azure AD, grant it Microsoft Graph read permissions, then paste the credentials below.',
//     fields: [
//       { key: 'tenantId',     label: 'Azure Tenant ID', secret: false },
//       { key: 'clientId',     label: 'Client ID',       secret: false },
//       { key: 'clientSecret', label: 'Client Secret',   secret: true  },
//     ],
//   },
//   keka: {
//     label: 'Keka HR',
//     accent: '#E84C3D',
//     note: 'Find your credentials in Keka under Settings → Developer → API Access.',
//     fields: [
//       { key: 'companyAlias',     label: 'Company Alias',    secret: false },
//       { key: 'clientId',         label: 'Client ID',        secret: false },
//       { key: 'clientSecret',     label: 'Client Secret',    secret: true  },
//       { key: 'coreHrApiKey',     label: 'Core HR API Key',  secret: true  },
//       { key: 'leaveApiKey',      label: 'Leave API Key',    secret: true  },
//       { key: 'attendanceApiKey', label: 'Attendance Key',   secret: true  },
//     ],
//   },
//   vault: {
//     label: 'HashiCorp Vault',
//     accent: '#000000',
//     note: 'Point to your self-hosted Vault instance and provide a token with read access to sys/mounts, sys/audit, and auth/token/lookup-self.',
//     fields: [
//       { key: 'baseUrl',    label: 'Vault Base URL', secret: false, placeholder: 'https://vault.yourcompany.com:8200' },
//       { key: 'vaultToken', label: 'Vault Token',    secret: true  },
//     ],
//   },
//   jumpcloud: {
//     label: 'JumpCloud',
//     accent: '#14283D',
//     note: 'Find your API key under Settings → Administrators → your profile → Enable API access.',
//     fields: [
//       { key: 'apiKey', label: 'API Key', secret: true },
//     ],
//   },
//   otx: {
//     label: 'OTX AlienVault',
//     accent: '#00A8E0',
//     note: 'Generate an API key from your OTX account settings page (free tier, no usage limits).',
//     fields: [
//       { key: 'apiKey', label: 'API Key', secret: true },
//     ],
//   },
//   gophish: {
//     label: 'GoPhish',
//     accent: '#5D4E8C',
//     note: 'Point to your self-hosted GoPhish instance and provide the Authorization API key from Settings.',
//     fields: [
//       { key: 'baseUrl', label: 'GoPhish Base URL', secret: false, placeholder: 'https://gophish.yourcompany.com' },
//       { key: 'apiKey',  label: 'API Key',          secret: true  },
//     ],
//   },
//   snyk: {
//     label: 'Snyk',
//     accent: '#4C4A73',
//     note: 'Find your Org ID and API token under Account Settings in the Snyk dashboard.',
//     fields: [
//       { key: 'orgId',  label: 'Organization ID', secret: false },
//       { key: 'apiKey', label: 'API Token',       secret: true  },
//     ],
//   },
//   cloudflare: {
//     label: 'Cloudflare',
//     accent: '#F38020',
//     note: 'Create a scoped API Token (Zone → Firewall Services, SSL and Certificates, Analytics — all Read) for your specific zone, then paste the Zone ID from your domain overview page.',
//     fields: [
//       { key: 'zoneId',   label: 'Zone ID',   secret: false },
//       { key: 'apiToken', label: 'API Token', secret: true  },
//     ],
//   },
//   notion: {
//     label: 'Notion',
//     accent: '#000000',
//     note: 'Create an internal integration at notion.so/my-integrations, share the target database with it, then paste the token and database ID below.',
//     fields: [
//       { key: 'databaseId',       label: 'Database ID',       secret: false },
//       { key: 'integrationToken', label: 'Integration Token', secret: true  },
//     ],
//   },
//   wazuh: {
//     label: 'Wazuh',
//     accent: '#3253DC',
//     note: 'Use your Wazuh manager URL and API credentials (default API port is 55000).',
//     fields: [
//       { key: 'baseUrl',  label: 'Wazuh Base URL', secret: false, placeholder: 'https://wazuh.yourcompany.com:55000' },
//       { key: 'username', label: 'Username',       secret: false },
//       { key: 'password', label: 'Password',       secret: true  },
//     ],
//   },
//   confluence: {
//     label: 'Confluence',
//     accent: '#172B4D',
//     note: 'Generate an API token from id.atlassian.com/manage-profile/security/api-tokens, then pair it with your Atlassian account email and Confluence site URL.',
//     fields: [
//       { key: 'siteUrl',  label: 'Site URL', secret: false, placeholder: 'https://yourcompany.atlassian.net' },
//       { key: 'email',    label: 'Atlassian Account Email', secret: false, placeholder: 'you@yourcompany.com' },
//       { key: 'apiToken', label: 'API Token', secret: true  },
//     ],
//   },
//   pfsense: {
//     label: 'pfSense',
//     accent: '#212121',
//     note: 'Requires the pfSense-API community package installed on your firewall. Point to your pfSense base URL and provide the API key from your pfSense-API configuration.',
//     fields: [
//       { key: 'baseUrl', label: 'pfSense Base URL', secret: false, placeholder: 'https://firewall.yourcompany.com' },
//       { key: 'apiKey',  label: 'API Key',          secret: true  },
//     ],
//   },
//   // ── NEW: CrowdStrike ─────────────────────────────────────────────────────
//   crowdstrike: {
//     label: 'CrowdStrike Falcon',
//     accent: '#E01F27',
//     note: 'Create an OAuth2 API client under Support and resources → API clients and keys in the Falcon console, with Hosts: Read, Vulnerabilities (Spotlight): Read, and Alerts: Read scopes. Base URL depends on your Falcon cloud region.',
//     fields: [
//       { key: 'baseUrl',      label: 'Falcon Base URL', secret: false, placeholder: 'https://api.crowdstrike.com' },
//       { key: 'clientId',     label: 'Client ID',       secret: false },
//       { key: 'clientSecret', label: 'Client Secret',   secret: true  },
//     ],
//   },
//   // ── NEW: OWASP ZAP ───────────────────────────────────────────────────────
//   owaspzap: {
//     label: 'OWASP ZAP',
//     accent: '#4B0082',
//     note: 'Point to your self-hosted ZAP daemon and the API key from Tools → Options → API in the ZAP GUI. Target URL should match the site ZAP has scanned so alerts are scoped correctly.',
//     fields: [
//       { key: 'baseUrl',   label: 'ZAP Base URL', secret: false, placeholder: 'http://zap.yourcompany.com:8080' },
//       { key: 'apiKey',    label: 'API Key',      secret: true  },
//       { key: 'targetUrl', label: 'Target URL (scanned site)', secret: false, placeholder: 'https://app.yourcompany.com' },
//     ],
//   },
// };


// export default function BuiltInProviderForm({ providerKey, configKey, savedConfig, onSave, onRemove, onTest }) {
//   const provider = PROVIDERS[providerKey];

//   // Guard: if a provider is listed in IntegrationsPage.jsx's BUILT_IN_PROVIDERS
//   // but has no matching entry in PROVIDERS above, show a friendly message
//   // instead of crashing the whole page.
//   if (!provider) {
//     return (
//       <Alert severity="warning" sx={{ borderRadius: '8px' }}>
//         No configuration form has been defined for "{providerKey}" yet.
//       </Alert>
//     );
//   }

//   // Use configKey (e.g. "jumpCloud") when it differs from the URL key
//   // (e.g. "jumpcloud"); falls back to providerKey for everything else.
//   const saved       = savedConfig?.[configKey ?? providerKey];
//   const isConnected = !!saved;

//   const initForm = () => {
//     const form = {};
//     provider.fields.forEach(f => {
//       form[f.key] = f.secret ? '' : (saved?.[f.key] ?? '');
//     });
//     return form;
//   };

//   const [form,    setForm]    = useState(initForm);
//   const [saving,  setSaving]  = useState(false);
//   const [testing, setTesting] = useState(false);
//   const [alert,   setAlert]   = useState(null);

//   const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

//   const handleSave = async () => {
//     setSaving(true);
//     setAlert(null);
//     try {
//       const payload = {};
//       provider.fields.forEach(f => {
//         const val = form[f.key];
//         if (f.secret && (!val || val.trim() === '')) return;
//         if (f.key === 'evidenceBuckets') {
//           payload[f.key] = val ? val.split(',').map(b => b.trim()).filter(Boolean) : [];
//         } else {
//           payload[f.key] = val;
//         }
//       });
//       const data = await onSave(providerKey, payload);
//       setAlert({ type: data.success ? 'success' : 'error', message: data.message });
//     } catch {
//       setAlert({ type: 'error', message: 'Failed to save. Please try again.' });
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleTest = async () => {
//     setTesting(true);
//     setAlert(null);
//     try {
//       const data = await onTest(providerKey);
//       setAlert({ type: data.success ? 'success' : 'error', message: data.message });
//     } catch {
//       setAlert({ type: 'error', message: 'Connection test failed.' });
//     } finally {
//       setTesting(false);
//     }
//   };

//   return (
//     <Box>
//       {/* Status row */}
//       <Box sx={{
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         mb: 3,
//         p: 2,
//         borderRadius: '10px',
//         background: isConnected
//           ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
//           : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
//         border: `1px solid ${isConnected ? '#bbf7d0' : '#e2e8f0'}`,
//       }}>
//         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//           <Box sx={{
//             width: 10, height: 10, borderRadius: '50%',
//             background: isConnected ? '#22c55e' : '#cbd5e1',
//             boxShadow: isConnected ? '0 0 0 3px #dcfce7' : 'none',
//           }} />
//           <Typography
//             variant="body2"
//             fontWeight={600}
//             color={isConnected ? '#15803d' : 'text.secondary'}
//           >
//             {isConnected ? 'Connected' : 'Not configured'}
//           </Typography>
//         </Box>
//         {isConnected && (
//           <Typography variant="caption" color="text.secondary">
//             Credentials encrypted · Last updated on save
//           </Typography>
//         )}
//       </Box>

//       {/* Setup note */}
//       <Box sx={{
//         mb: 3, p: 2,
//         borderRadius: '8px',
//         background: '#f8fafc',
//         borderLeft: `3px solid ${provider.accent}`,
//       }}>
//         <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
//           {provider.note}
//         </Typography>
//       </Box>

//       <Divider sx={{ mb: 3 }} />

//       {/* Fields */}
//       <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
//         {provider.fields.map(f => (
//           <TextField
//             key={f.key}
//             label={f.label}
//             value={form[f.key] ?? ''}
//             onChange={set(f.key)}
//             type={f.secret ? 'password' : 'text'}
//             multiline={!!f.multiline}
//             rows={f.multiline ? 5 : 1}
//             placeholder={f.secret && isConnected ? 'Leave blank to keep existing value' : (f.placeholder ?? '')}
//             size="small"
//             fullWidth
//             sx={{
//               '& .MuiOutlinedInput-root': {
//                 borderRadius: '8px',
//                 fontSize: '0.875rem',
//                 '&:hover fieldset': { borderColor: provider.accent },
//                 '&.Mui-focused fieldset': { borderColor: provider.accent },
//               },
//               '& label.Mui-focused': { color: provider.accent },
//             }}
//           />
//         ))}
//       </Box>

//       {alert && (
//         <Alert severity={alert.type} sx={{ mt: 2.5, borderRadius: '8px' }}>
//           {alert.message}
//         </Alert>
//       )}

//       {/* Actions */}
//       <Box sx={{ display: 'flex', gap: 1.5, mt: 3, flexWrap: 'wrap', alignItems: 'center' }}>
//         <Button
//           variant="contained"
//           onClick={handleSave}
//           disabled={saving}
//           startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveOutlinedIcon />}
//           sx={{
//             borderRadius: '8px',
//             textTransform: 'none',
//             fontWeight: 600,
//             fontSize: '0.85rem',
//             background: provider.accent,
//             '&:hover': { background: provider.accent, filter: 'brightness(0.9)' },
//             '&:disabled': { opacity: 0.6 },
//           }}
//         >
//           {saving ? 'Saving…' : 'Save credentials'}
//         </Button>

//         {isConnected && (
//           <>
//             <Button
//               variant="outlined"
//               onClick={handleTest}
//               disabled={testing}
//               startIcon={testing ? <CircularProgress size={14} /> : <WifiTetheringIcon />}
//               sx={{
//                 borderRadius: '8px',
//                 textTransform: 'none',
//                 fontWeight: 500,
//                 fontSize: '0.85rem',
//                 borderColor: provider.accent,
//                 color: provider.accent,
//                 '&:hover': { borderColor: provider.accent, background: `${provider.accent}10` },
//               }}
//             >
//               {testing ? 'Testing…' : 'Test connection'}
//             </Button>

//             <Button
//               variant="text"
//               color="error"
//               onClick={() => onRemove(providerKey)}
//               startIcon={<LinkOffIcon />}
//               sx={{
//                 borderRadius: '8px',
//                 textTransform: 'none',
//                 fontWeight: 500,
//                 fontSize: '0.85rem',
//                 ml: 'auto',
//               }}
//             >
//               Disconnect
//             </Button>
//           </>
//         )}
//       </Box>
//     </Box>
//   );
// }

// src/modules/admin/components/Integrations/BuiltInProviderForm.jsx
import { useState } from 'react';
import {
  Box, TextField, Button, CircularProgress,
  Alert, Typography, Divider
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import WifiTetheringIcon from '@mui/icons-material/WifiTethering';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';

const PROVIDERS = {
  aws: {
    label: 'Amazon Web Services',
    accent: '#FF9900',
    note: 'Create a cross-account IAM role that trusts CalVant, then paste the Role ARN. Your credentials are encrypted with AES-256-GCM before storage — never stored in plaintext.',
    fields: [
      { key: 'accountId',       label: 'Account ID',                   secret: false },
      { key: 'region',          label: 'Region',                       secret: false, placeholder: 'ap-south-1' },
      { key: 'roleArn',         label: 'Role ARN',                     secret: true,  placeholder: 'arn:aws:iam::123456789012:role/CalVantReadOnly' },
      { key: 'evidenceBuckets', label: 'Evidence Buckets (comma-separated)', secret: false, placeholder: 'bucket-1, bucket-2' },
    ],
  },
  gws: {
    label: 'Google Workspace',
    accent: '#4285F4',
    note: 'Create a GCP service account with domain-wide delegation enabled, then paste the full JSON key below.',
    fields: [
      { key: 'domain',             label: 'Domain',               secret: false, placeholder: 'yourcompany.com' },
      { key: 'customerId',         label: 'Customer ID',          secret: false, placeholder: 'C0xxxxxxx' },
      { key: 'adminUser',          label: 'Admin User Email',     secret: false, placeholder: 'admin@yourcompany.com' },
      { key: 'serviceAccountJson', label: 'Service Account JSON', secret: true,  multiline: true },
    ],
  },
  m365: {
    label: 'Microsoft 365',
    accent: '#0078D4',
    note: 'Register an app in Azure AD, grant it Microsoft Graph read permissions, then paste the credentials below.',
    fields: [
      { key: 'tenantId',     label: 'Azure Tenant ID', secret: false },
      { key: 'clientId',     label: 'Client ID',       secret: false },
      { key: 'clientSecret', label: 'Client Secret',   secret: true  },
    ],
  },
  keka: {
    label: 'Keka HR',
    accent: '#E84C3D',
    note: 'Find your credentials in Keka under Settings → Developer → API Access.',
    fields: [
      { key: 'companyAlias',     label: 'Company Alias',    secret: false },
      { key: 'clientId',         label: 'Client ID',        secret: false },
      { key: 'clientSecret',     label: 'Client Secret',    secret: true  },
      { key: 'coreHrApiKey',     label: 'Core HR API Key',  secret: true  },
      { key: 'leaveApiKey',      label: 'Leave API Key',    secret: true  },
      { key: 'attendanceApiKey', label: 'Attendance Key',   secret: true  },
    ],
  },
  vault: {
    label: 'HashiCorp Vault',
    accent: '#000000',
    note: 'Point to your self-hosted Vault instance and provide a token with read access to sys/mounts, sys/audit, and auth/token/lookup-self.',
    fields: [
      { key: 'baseUrl',    label: 'Vault Base URL', secret: false, placeholder: 'https://vault.yourcompany.com:8200' },
      { key: 'vaultToken', label: 'Vault Token',    secret: true  },
    ],
  },
  jumpcloud: {
    label: 'JumpCloud',
    accent: '#14283D',
    note: 'Find your API key under Settings → Administrators → your profile → Enable API access.',
    fields: [
      { key: 'apiKey', label: 'API Key', secret: true },
    ],
  },
  otx: {
    label: 'OTX AlienVault',
    accent: '#00A8E0',
    note: 'Generate an API key from your OTX account settings page (free tier, no usage limits).',
    fields: [
      { key: 'apiKey', label: 'API Key', secret: true },
    ],
  },
  gophish: {
    label: 'GoPhish',
    accent: '#5D4E8C',
    note: 'Point to your self-hosted GoPhish instance and provide the Authorization API key from Settings.',
    fields: [
      { key: 'baseUrl', label: 'GoPhish Base URL', secret: false, placeholder: 'https://gophish.yourcompany.com' },
      { key: 'apiKey',  label: 'API Key',          secret: true  },
    ],
  },
  snyk: {
    label: 'Snyk',
    accent: '#4C4A73',
    note: 'Find your Org ID and API token under Account Settings in the Snyk dashboard.',
    fields: [
      { key: 'orgId',  label: 'Organization ID', secret: false },
      { key: 'apiKey', label: 'API Token',       secret: true  },
    ],
  },
  cloudflare: {
    label: 'Cloudflare',
    accent: '#F38020',
    note: 'Create a scoped API Token (Zone → Firewall Services, SSL and Certificates, Analytics — all Read) for your specific zone, then paste the Zone ID from your domain overview page.',
    fields: [
      { key: 'zoneId',   label: 'Zone ID',   secret: false },
      { key: 'apiToken', label: 'API Token', secret: true  },
    ],
  },
  notion: {
    label: 'Notion',
    accent: '#000000',
    note: 'Create an internal integration at notion.so/my-integrations, share the target database with it, then paste the token and database ID below.',
    fields: [
      { key: 'databaseId',       label: 'Database ID',       secret: false },
      { key: 'integrationToken', label: 'Integration Token', secret: true  },
    ],
  },
  wazuh: {
    label: 'Wazuh',
    accent: '#3253DC',
    note: 'Use your Wazuh manager URL and API credentials (default API port is 55000).',
    fields: [
      { key: 'baseUrl',  label: 'Wazuh Base URL', secret: false, placeholder: 'https://wazuh.yourcompany.com:55000' },
      { key: 'username', label: 'Username',       secret: false },
      { key: 'password', label: 'Password',       secret: true  },
    ],
  },
  confluence: {
    label: 'Confluence',
    accent: '#172B4D',
    note: 'Generate an API token from id.atlassian.com/manage-profile/security/api-tokens, then pair it with your Atlassian account email and Confluence site URL.',
    fields: [
      { key: 'siteUrl',  label: 'Site URL', secret: false, placeholder: 'https://yourcompany.atlassian.net' },
      { key: 'email',    label: 'Atlassian Account Email', secret: false, placeholder: 'you@yourcompany.com' },
      { key: 'apiToken', label: 'API Token', secret: true  },
    ],
  },
  pfsense: {
    label: 'pfSense',
    accent: '#212121',
    note: 'Requires the pfSense-API community package installed on your firewall. Point to your pfSense base URL and provide the API key from your pfSense-API configuration.',
    fields: [
      { key: 'baseUrl', label: 'pfSense Base URL', secret: false, placeholder: 'https://firewall.yourcompany.com' },
      { key: 'apiKey',  label: 'API Key',          secret: true  },
    ],
  },
  crowdstrike: {
    label: 'CrowdStrike Falcon',
    accent: '#E01F27',
    note: 'Create an OAuth2 API client under Support and resources → API clients and keys in the Falcon console, with Hosts: Read, Vulnerabilities (Spotlight): Read, and Alerts: Read scopes. Base URL depends on your Falcon cloud region.',
    fields: [
      { key: 'baseUrl',      label: 'Falcon Base URL', secret: false, placeholder: 'https://api.crowdstrike.com' },
      { key: 'clientId',     label: 'Client ID',       secret: false },
      { key: 'clientSecret', label: 'Client Secret',   secret: true  },
    ],
  },
  owaspzap: {
    label: 'OWASP ZAP',
    accent: '#4B0082',
    note: 'Point to your self-hosted ZAP daemon and the API key from Tools → Options → API in the ZAP GUI. Target URL should match the site ZAP has scanned so alerts are scoped correctly.',
    fields: [
      { key: 'baseUrl',   label: 'ZAP Base URL', secret: false, placeholder: 'http://zap.yourcompany.com:8080' },
      { key: 'apiKey',    label: 'API Key',      secret: true  },
      { key: 'targetUrl', label: 'Target URL (scanned site)', secret: false, placeholder: 'https://app.yourcompany.com' },
    ],
  },
  // ── NEW: Keycloak ────────────────────────────────────────────────────────
  keycloak: {
    label: 'Keycloak',
    accent: '#4D4D4D',
    note: 'Create a confidential client in your realm with Service Accounts enabled, and assign it the realm-management "view-users" and "view-events" roles. Also confirm Realm Settings → Events → "Save Events" is turned on, otherwise the access-review control will always show non-compliant.',
    fields: [
      { key: 'baseUrl',      label: 'Keycloak Base URL', secret: false, placeholder: 'https://auth.yourcompany.com' },
      { key: 'realm',        label: 'Realm',             secret: false, placeholder: 'yourcompany' },
      { key: 'clientId',     label: 'Client ID',         secret: false },
      { key: 'clientSecret', label: 'Client Secret',     secret: true  },
    ],
  },
};


export default function BuiltInProviderForm({ providerKey, configKey, savedConfig, onSave, onRemove, onTest }) {
  const provider = PROVIDERS[providerKey];

  // Guard: if a provider is listed in IntegrationsPage.jsx's BUILT_IN_PROVIDERS
  // but has no matching entry in PROVIDERS above, show a friendly message
  // instead of crashing the whole page.
  if (!provider) {
    return (
      <Alert severity="warning" sx={{ borderRadius: '8px' }}>
        No configuration form has been defined for "{providerKey}" yet.
      </Alert>
    );
  }

  // Use configKey (e.g. "jumpCloud") when it differs from the URL key
  // (e.g. "jumpcloud"); falls back to providerKey for everything else.
  const saved       = savedConfig?.[configKey ?? providerKey];
  const isConnected = !!saved;

  const initForm = () => {
    const form = {};
    provider.fields.forEach(f => {
      form[f.key] = f.secret ? '' : (saved?.[f.key] ?? '');
    });
    return form;
  };

  const [form,    setForm]    = useState(initForm);
  const [saving,  setSaving]  = useState(false);
  const [testing, setTesting] = useState(false);
  const [alert,   setAlert]   = useState(null);

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setAlert(null);
    try {
      const payload = {};
      provider.fields.forEach(f => {
        const val = form[f.key];
        if (f.secret && (!val || val.trim() === '')) return;
        if (f.key === 'evidenceBuckets') {
          payload[f.key] = val ? val.split(',').map(b => b.trim()).filter(Boolean) : [];
        } else {
          payload[f.key] = val;
        }
      });
      const data = await onSave(providerKey, payload);
      setAlert({ type: data.success ? 'success' : 'error', message: data.message });
    } catch {
      setAlert({ type: 'error', message: 'Failed to save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setAlert(null);
    try {
      const data = await onTest(providerKey);
      setAlert({ type: data.success ? 'success' : 'error', message: data.message });
    } catch {
      setAlert({ type: 'error', message: 'Connection test failed.' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Box>
      {/* Status row */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 3,
        p: 2,
        borderRadius: '10px',
        background: isConnected
          ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        border: `1px solid ${isConnected ? '#bbf7d0' : '#e2e8f0'}`,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 10, height: 10, borderRadius: '50%',
            background: isConnected ? '#22c55e' : '#cbd5e1',
            boxShadow: isConnected ? '0 0 0 3px #dcfce7' : 'none',
          }} />
          <Typography
            variant="body2"
            fontWeight={600}
            color={isConnected ? '#15803d' : 'text.secondary'}
          >
            {isConnected ? 'Connected' : 'Not configured'}
          </Typography>
        </Box>
        {isConnected && (
          <Typography variant="caption" color="text.secondary">
            Credentials encrypted · Last updated on save
          </Typography>
        )}
      </Box>

      {/* Setup note */}
      <Box sx={{
        mb: 3, p: 2,
        borderRadius: '8px',
        background: '#f8fafc',
        borderLeft: `3px solid ${provider.accent}`,
      }}>
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          {provider.note}
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Fields */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {provider.fields.map(f => (
          <TextField
            key={f.key}
            label={f.label}
            value={form[f.key] ?? ''}
            onChange={set(f.key)}
            type={f.secret ? 'password' : 'text'}
            multiline={!!f.multiline}
            rows={f.multiline ? 5 : 1}
            placeholder={f.secret && isConnected ? 'Leave blank to keep existing value' : (f.placeholder ?? '')}
            size="small"
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                fontSize: '0.875rem',
                '&:hover fieldset': { borderColor: provider.accent },
                '&.Mui-focused fieldset': { borderColor: provider.accent },
              },
              '& label.Mui-focused': { color: provider.accent },
            }}
          />
        ))}
      </Box>

      {alert && (
        <Alert severity={alert.type} sx={{ mt: 2.5, borderRadius: '8px' }}>
          {alert.message}
        </Alert>
      )}

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 1.5, mt: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveOutlinedIcon />}
          sx={{
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.85rem',
            background: provider.accent,
            '&:hover': { background: provider.accent, filter: 'brightness(0.9)' },
            '&:disabled': { opacity: 0.6 },
          }}
        >
          {saving ? 'Saving…' : 'Save credentials'}
        </Button>

        {isConnected && (
          <>
            <Button
              variant="outlined"
              onClick={handleTest}
              disabled={testing}
              startIcon={testing ? <CircularProgress size={14} /> : <WifiTetheringIcon />}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.85rem',
                borderColor: provider.accent,
                color: provider.accent,
                '&:hover': { borderColor: provider.accent, background: `${provider.accent}10` },
              }}
            >
              {testing ? 'Testing…' : 'Test connection'}
            </Button>

            <Button
              variant="text"
              color="error"
              onClick={() => onRemove(providerKey)}
              startIcon={<LinkOffIcon />}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.85rem',
                ml: 'auto',
              }}
            >
              Disconnect
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}