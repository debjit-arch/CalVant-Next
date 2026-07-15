// // src/modules/admin/components/Integrations/IntegrationsPage.jsx
// 'use client';
// import { useState, useEffect } from 'react';
// import axios from 'axios';
// import {
//   Box, Typography, Paper, Button, Chip, IconButton,
//   Alert, CircularProgress, Card, CardContent, CardActions,
//   Tooltip, Divider, Grid
// } from '@mui/material';
// import AddIcon              from '@mui/icons-material/Add';
// import EditIcon             from '@mui/icons-material/Edit';
// import DeleteIcon           from '@mui/icons-material/Delete';
// import SyncIcon             from '@mui/icons-material/Sync';
// import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
// import ExtensionIcon        from '@mui/icons-material/Extension';

// import integrationApi          from './integrationApi';
// import BuiltInProviderForm     from './BuiltInProviderForm';
// import CustomIntegrationDialog from './CustomIntegrationDialog';

// // ── Provider metadata ─────────────────────────────────────────────────────────
// // `key` = URL segment used by the backend (/api/integrations/{tenantId}/{key})
// // `configKey` = field name in the masked config JSON response, only needed
// //   when it differs from `key` (JumpCloud is the one exception — backend
// //   route is lowercase "jumpcloud" but the JSON field is camelCase "jumpCloud").
// const BUILT_IN_PROVIDERS = [
//   {
//     key: 'aws',
//     label: 'Amazon Web Services',
//     shortLabel: 'AWS',
//     accent: '#FF9900',
//     icon: '☁️',
//     description: 'IAM, S3, CloudTrail, GuardDuty',
//   },
//   {
//     key: 'gws',
//     label: 'Google Workspace',
//     shortLabel: 'Google WS',
//     accent: '#4285F4',
//     icon: '🔵',
//     description: 'Admin SDK, Drive, Audit Logs',
//   },
//   {
//     key: 'm365',
//     label: 'Microsoft 365',
//     shortLabel: 'M365',
//     accent: '#0078D4',
//     icon: '🟦',
//     description: 'Azure AD, SharePoint, Defender',
//   },
//   {
//     key: 'keka',
//     label: 'Keka HR',
//     shortLabel: 'Keka',
//     accent: '#E84C3D',
//     icon: '👥',
//     description: 'Core HR, Leave, Attendance',
//   },
//   {
//     key: 'vault',
//     label: 'HashiCorp Vault',
//     shortLabel: 'Vault',
//     accent: '#000000',
//     icon: '🔐',
//     description: 'Secrets, dynamic credentials, PKI',
//   },
//   {
//     key: 'jumpcloud',
//     configKey: 'jumpCloud',
//     label: 'JumpCloud',
//     shortLabel: 'JumpCloud',
//     accent: '#14283D',
//     icon: '🟢',
//     description: 'Device & identity management',
//   },
//   {
//     key: 'otx',
//     label: 'OTX AlienVault',
//     shortLabel: 'OTX',
//     accent: '#00A8E0',
//     icon: '🛡️',
//     description: 'Threat intelligence feed',
//   },
//   {
//     key: 'gophish',
//     label: 'GoPhish',
//     shortLabel: 'GoPhish',
//     accent: '#5D4E8C',
//     icon: '🎣',
//     description: 'Phishing simulation & training',
//   },
//   {
//     key: 'snyk',
//     label: 'Snyk',
//     shortLabel: 'Snyk',
//     accent: '#4C4A73',
//     icon: '🐍',
//     description: 'Code & dependency scanning',
//   },
//   {
//     key: 'cloudflare',
//     label: 'Cloudflare',
//     shortLabel: 'Cloudflare',
//     accent: '#F38020',
//     icon: '🟧',
//     description: 'WAF, firewall, TLS enforcement',
//   },
//   {
//     key: 'notion',
//     label: 'Notion',
//     shortLabel: 'Notion',
//     accent: '#000000',
//     icon: '📝',
//     description: 'Policy & documentation tracking',
//   },
//   {
//     key: 'wazuh',
//     label: 'Wazuh',
//     shortLabel: 'Wazuh',
//     accent: '#3253DC',
//     icon: '🦉',
//     description: 'Vulnerability & log monitoring',
//   },
// ];

// const TYPE_COLORS = {
//   CLOUD: 'primary', HRMS: 'secondary', IAM: 'warning',
//   TICKETING: 'info', COMMUNICATION: 'success', CUSTOM: 'default',
// };

// // ── Nav item ──────────────────────────────────────────────────────────────────
// function NavItem({ provider, isSelected, isConnected, onClick }) {
//   return (
//     <Box
//       onClick={onClick}
//       sx={{
//         display: 'flex',
//         alignItems: 'center',
//         gap: 1.5,
//         px: 2,
//         py: 1.5,
//         borderRadius: '10px',
//         cursor: 'pointer',
//         transition: 'all 0.15s ease',
//         background: isSelected
//           ? `linear-gradient(135deg, ${provider.accent}18 0%, ${provider.accent}08 100%)`
//           : 'transparent',
//         borderLeft: isSelected
//           ? `3px solid ${provider.accent}`
//           : '3px solid transparent',
//         '&:hover': {
//           background: isSelected
//             ? `linear-gradient(135deg, ${provider.accent}18 0%, ${provider.accent}08 100%)`
//             : '#f8fafc',
//         },
//       }}
//     >
//       <Typography fontSize="1.1rem" lineHeight={1}>{provider.icon}</Typography>
//       <Box sx={{ flex: 1, minWidth: 0 }}>
//         <Typography
//           variant="body2"
//           fontWeight={isSelected ? 700 : 500}
//           color={isSelected ? 'text.primary' : 'text.secondary'}
//           noWrap
//           fontSize="0.85rem"
//         >
//           {provider.shortLabel}
//         </Typography>
//       </Box>
//       {isConnected && (
//         <Box sx={{
//           width: 7, height: 7, borderRadius: '50%',
//           background: '#22c55e',
//           flexShrink: 0,
//         }} />
//       )}
//     </Box>
//   );
// }

// // ── Custom tool card ──────────────────────────────────────────────────────────
// function CustomToolCard({ item, onToggle, onEdit, onDelete }) {
//   return (
//     <Card variant="outlined" sx={{
//       borderRadius: '12px',
//       border: '1px solid #e8edf2',
//       opacity: item.status === 'INACTIVE' ? 0.55 : 1,
//       transition: 'opacity 0.2s, box-shadow 0.2s',
//       '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
//     }}>
//       <CardContent sx={{ pb: 1 }}>
//         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
//           <Box>
//             <Typography fontWeight={700} variant="body2" color="text.primary">
//               {item.name}
//             </Typography>
//             {item.baseUrl && (
//               <Typography variant="caption" color="text.secondary" display="block" sx={{
//                 overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180,
//               }}>
//                 {item.baseUrl}
//               </Typography>
//             )}
//           </Box>
//           <Chip
//             label={item.status}
//             size="small"
//             color={item.status === 'ACTIVE' ? 'success' : 'default'}
//             sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
//           />
//         </Box>

//         <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1 }}>
//           <Chip label={item.type} size="small" color={TYPE_COLORS[item.type] ?? 'default'} variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
//           <Chip label={item.authType} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
//         </Box>

//         {item.description && (
//           <Typography variant="caption" color="text.secondary" display="block" mt={1} sx={{
//             lineHeight: 1.4, overflow: 'hidden',
//             display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
//           }}>
//             {item.description}
//           </Typography>
//         )}

//         {item.credentials && Object.keys(item.credentials).length > 0 && (
//           <Typography variant="caption" color="text.disabled" display="block" mt={0.75}>
//             Fields: {Object.keys(item.credentials).join(', ')}
//           </Typography>
//         )}
//       </CardContent>

//       <Divider />

//       <CardActions sx={{ px: 1.5, py: 0.75, gap: 0.5 }}>
//         <Tooltip title={item.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
//           <IconButton size="small" onClick={() => onToggle(item.id)} sx={{ color: item.status === 'ACTIVE' ? '#22c55e' : 'text.disabled' }}>
//             <PowerSettingsNewIcon sx={{ fontSize: 16 }} />
//           </IconButton>
//         </Tooltip>
//         <Tooltip title="Edit">
//           <IconButton size="small" onClick={() => onEdit(item)} sx={{ color: 'text.secondary' }}>
//             <EditIcon sx={{ fontSize: 16 }} />
//           </IconButton>
//         </Tooltip>
//         <Box sx={{ flex: 1 }} />
//         <Tooltip title="Delete">
//           <IconButton size="small" onClick={() => onDelete(item.id, item.name)} sx={{ color: '#ef4444' }}>
//             <DeleteIcon sx={{ fontSize: 16 }} />
//           </IconButton>
//         </Tooltip>
//       </CardActions>
//     </Card>
//   );
// }

// // ── Main page ─────────────────────────────────────────────────────────────────
// export default function IntegrationsPage() {

//   // ── Resolve tenantId the same way RiskAssessmentTable does ───────────────
//   // Read from sessionStorage cache first (already set by compliance page),
//   // otherwise fetch from user-service. Never use JWT.organization directly
//   // because that is the MongoDB _id, not the tenantId string.
//   const [tenantId,  setTenantId]  = useState(null);
//   const [tenantErr, setTenantErr] = useState(false);

//   useEffect(() => {
//     const resolve = async () => {
//       const cached = sessionStorage.getItem('tenantId');
//       if (cached) { setTenantId(cached); return; }

//       try {
//         const user  = JSON.parse(sessionStorage.getItem('user') || '{}');
//         const orgId = user?.organization?._id ?? user?.organization;
//         if (!orgId) { setTenantErr(true); return; }

//         const res = await axios.get(
//           `https://api.calvant.com/user-service/api/organizations/${orgId}/tenant`,
//           { headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` } }
//         );
//         const tid = res.data;
//         sessionStorage.setItem('tenantId', tid);
//         setTenantId(tid);
//       } catch (err) {
//         console.error('Failed to resolve tenantId:', err);
//         setTenantErr(true);
//       }
//     };
//     resolve();
//   }, []);

//   // 0..N-1 = built-in providers, N = custom tools (N = BUILT_IN_PROVIDERS.length)
//   const CUSTOM_TAB_INDEX = BUILT_IN_PROVIDERS.length;

//   const [activeNav,     setActiveNav]     = useState(0);
//   const [builtInConfig, setBuiltInConfig] = useState({});
//   const [customList,    setCustomList]    = useState([]);
//   const [loading,       setLoading]       = useState(true);
//   const [syncing,       setSyncing]       = useState(false);
//   const [syncAlert,     setSyncAlert]     = useState(null);
//   const [dialogOpen,    setDialogOpen]    = useState(false);
//   const [editing,       setEditing]       = useState(null);

//   useEffect(() => { if (tenantId) loadAll(); }, [tenantId]);

//   const loadAll = async () => {
//     setLoading(true);
//     try {
//       const [config, customs] = await Promise.all([
//         integrationApi.getBuiltInConfig(tenantId),
//         integrationApi.getAllCustom(tenantId),
//       ]);
//       setBuiltInConfig(config ?? {});
//       setCustomList(Array.isArray(customs) ? customs : customs?.data ?? customs?.items ?? []);
//     } catch {
//       setSyncAlert({ type: 'error', message: 'Failed to load integrations.' });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Built-in handlers
//   const handleSave = async (provider, payload) => {
//     const data = await integrationApi.saveBuiltIn(tenantId, provider, payload);
//     if (data.success) await loadAll();
//     return data;
//   };
//   const handleRemove = async (provider) => {
//     if (!confirm(`Disconnect ${provider.toUpperCase()}?`)) return;
//     await integrationApi.removeBuiltIn(tenantId, provider);
//     await loadAll();
//   };
//   const handleTest = async (provider) => integrationApi.testBuiltIn(tenantId, provider);

//   // Custom handlers
//   const handleCustomSubmit = async (form, id) => {
//     if (id) await integrationApi.updateCustom(tenantId, id, form);
//     else    await integrationApi.createCustom(tenantId, form);
//     setDialogOpen(false);
//     setEditing(null);
//     await loadAll();
//   };
//   const handleCustomDelete = async (id, name) => {
//     if (!confirm(`Remove "${name}"?`)) return;
//     await integrationApi.deleteCustom(tenantId, id);
//     await loadAll();
//   };
//   const handleToggle = async (id) => {
//     await integrationApi.toggleCustom(tenantId, id);
//     await loadAll();
//   };

//   // Sync
//   const handleSync = async () => {
//     setSyncing(true);
//     setSyncAlert(null);
//     try {
//       await integrationApi.triggerSync(tenantId);
//       setSyncAlert({ type: 'success', message: 'Compliance sync completed successfully.' });
//     } catch {
//       setSyncAlert({ type: 'error', message: 'Sync failed. Please try again.' });
//     } finally {
//       setSyncing(false);
//     }
//   };

//   // ── Guards ────────────────────────────────────────────────────────────────
//   if (tenantErr) return (
//     <Box sx={{ p: 4 }}>
//       <Alert severity="error">Could not resolve tenant. Please log in again.</Alert>
//     </Box>
//   );

//   if (!tenantId) return (
//     <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
//       <CircularProgress size={32} />
//     </Box>
//   );

//   if (loading) return (
//     <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
//       <CircularProgress size={32} />
//     </Box>
//   );

//   const connectedBuiltIn = BUILT_IN_PROVIDERS.filter(p => !!builtInConfig[p.configKey ?? p.key]).length;
//   const activeCustom     = customList.filter(c => c.status === 'ACTIVE').length;
//   const totalConnected   = connectedBuiltIn + activeCustom;

//   const isCustomTab    = activeNav === CUSTOM_TAB_INDEX;
//   const activeProvider = !isCustomTab ? BUILT_IN_PROVIDERS[activeNav] : null;

//   return (
//     <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>

//       {/* Page header */}
//       <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
//         <Box>
//           <Typography variant="h5" fontWeight={800} color="text.primary" letterSpacing="-0.3px">
//             Integrations
//           </Typography>
//           <Typography variant="body2" color="text.secondary" mt={0.5}>
//             Connect your cloud, HR, and security tools. Credentials are encrypted before storage.
//           </Typography>
//         </Box>
//         <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
//           <Chip
//             label={`${totalConnected} active`}
//             size="small"
//             color={totalConnected > 0 ? 'success' : 'default'}
//             sx={{ fontWeight: 600, fontSize: '0.75rem' }}
//           />
//           <Button
//             variant="contained"
//             startIcon={syncing ? <CircularProgress size={14} color="inherit" /> : <SyncIcon />}
//             onClick={handleSync}
//             disabled={syncing || totalConnected === 0}
//             size="small"
//             sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px', fontSize: '0.82rem' }}
//           >
//             {syncing ? 'Syncing…' : 'Run compliance sync'}
//           </Button>
//         </Box>
//       </Box>

//       {syncAlert && (
//         <Alert severity={syncAlert.type} sx={{ mb: 2, borderRadius: '10px' }} onClose={() => setSyncAlert(null)}>
//           {syncAlert.message}
//         </Alert>
//       )}

//       {/* Main layout: sidebar + content */}
//       <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>

//         {/* ── Left sidebar ──────────────────────────────────────────────── */}
//         <Paper variant="outlined" sx={{ width: 200, flexShrink: 0, borderRadius: '14px', border: '1px solid #e8edf2', overflow: 'hidden' }}>
//           <Box sx={{ p: 1.5, pb: 1 }}>
//             <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ letterSpacing: '0.08em', fontSize: '0.68rem', px: 0.5 }}>
//               BUILT-IN
//             </Typography>
//           </Box>
//           <Box sx={{ px: 1, pb: 1, maxHeight: 520, overflowY: 'auto' }}>
//             {BUILT_IN_PROVIDERS.map((provider, i) => (
//               <NavItem
//                 key={provider.key}
//                 provider={provider}
//                 isSelected={activeNav === i}
//                 isConnected={!!builtInConfig[provider.configKey ?? provider.key]}
//                 onClick={() => setActiveNav(i)}
//               />
//             ))}
//           </Box>

//           <Divider />

//           <Box sx={{ p: 1.5, pb: 1, pt: 1.5 }}>
//             <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ letterSpacing: '0.08em', fontSize: '0.68rem', px: 0.5 }}>
//               CUSTOM TOOLS
//             </Typography>
//           </Box>
//           <Box sx={{ px: 1, pb: 1.5 }}>
//             <Box
//               onClick={() => setActiveNav(CUSTOM_TAB_INDEX)}
//               sx={{
//                 display: 'flex', alignItems: 'center', gap: 1.5,
//                 px: 2, py: 1.5, borderRadius: '10px', cursor: 'pointer',
//                 transition: 'all 0.15s ease',
//                 background: isCustomTab ? 'linear-gradient(135deg, #6366f118 0%, #6366f108 100%)' : 'transparent',
//                 borderLeft: isCustomTab ? '3px solid #6366f1' : '3px solid transparent',
//                 '&:hover': { background: isCustomTab ? 'linear-gradient(135deg, #6366f118 0%, #6366f108 100%)' : '#f8fafc' },
//               }}
//             >
//               <ExtensionIcon sx={{ fontSize: 16, color: isCustomTab ? '#6366f1' : 'text.disabled' }} />
//               <Typography variant="body2" fontWeight={isCustomTab ? 700 : 500} color={isCustomTab ? 'text.primary' : 'text.secondary'} fontSize="0.85rem" sx={{ flex: 1 }}>
//                 My tools
//               </Typography>
//               {customList.length > 0 && (
//                 <Chip label={customList.length} size="small" color="primary" sx={{ height: 16, fontSize: '0.6rem', minWidth: 20 }} />
//               )}
//             </Box>
//           </Box>
//         </Paper>

//         {/* ── Right content panel ───────────────────────────────────────── */}
//         <Paper variant="outlined" sx={{ flex: 1, borderRadius: '14px', border: '1px solid #e8edf2', overflow: 'hidden' }}>
//           <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafbfc' }}>
//             {isCustomTab ? (
//               <>
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//                   <ExtensionIcon sx={{ color: '#6366f1', fontSize: 20 }} />
//                   <Box>
//                     <Typography fontWeight={700} fontSize="0.95rem" color="text.primary">Custom integrations</Typography>
//                     <Typography variant="caption" color="text.secondary">Connect any tool not listed above</Typography>
//                   </Box>
//                 </Box>
//                 <Button
//                   variant="contained" size="small" startIcon={<AddIcon />}
//                   onClick={() => { setEditing(null); setDialogOpen(true); }}
//                   sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px', fontSize: '0.82rem', background: '#6366f1', '&:hover': { background: '#4f46e5' } }}
//                 >
//                   Add tool
//                 </Button>
//               </>
//             ) : (
//               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//                 <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: `${activeProvider.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
//                   {activeProvider.icon}
//                 </Box>
//                 <Box>
//                   <Typography fontWeight={700} fontSize="0.95rem" color="text.primary">{activeProvider.label}</Typography>
//                   <Typography variant="caption" color="text.secondary">{activeProvider.description}</Typography>
//                 </Box>
//               </Box>
//             )}
//           </Box>

//           <Box sx={{ p: 3 }}>
//             {!isCustomTab && (
//               <BuiltInProviderForm
//                 providerKey={activeProvider.key}
//                 configKey={activeProvider.configKey ?? activeProvider.key}
//                 savedConfig={builtInConfig}
//                 onSave={handleSave}
//                 onRemove={handleRemove}
//                 onTest={handleTest}
//               />
//             )}

//             {isCustomTab && (
//               <>
//                 {customList.length === 0 ? (
//                   <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
//                     <ExtensionIcon sx={{ fontSize: 40, color: '#e2e8f0', mb: 2, display: 'block', mx: 'auto' }} />
//                     <Typography variant="body2" fontWeight={500} color="text.secondary">No custom tools connected yet</Typography>
//                     <Typography variant="caption" color="text.disabled">Click "Add tool" to connect Okta, Slack, Salesforce, or any other service.</Typography>
//                   </Box>
//                 ) : (
//                   <Grid container spacing={2}>
//                     {customList.map(item => (
//                       <Grid item xs={12} sm={6} key={item.id}>
//                         <CustomToolCard
//                           item={item}
//                           onToggle={handleToggle}
//                           onEdit={(i) => { setEditing(i); setDialogOpen(true); }}
//                           onDelete={handleCustomDelete}
//                         />
//                       </Grid>
//                     ))}
//                   </Grid>
//                 )}
//               </>
//             )}
//           </Box>
//         </Paper>
//       </Box>

//       <CustomIntegrationDialog
//         open={dialogOpen}
//         onClose={() => { setDialogOpen(false); setEditing(null); }}
//         onSubmit={handleCustomSubmit}
//         editing={editing}
//       />
//     </Box>
//   );
// }
//Tested and success-------------------------==================------------------------==================
// // src/modules/admin/components/Integrations/IntegrationsPage.jsx
// 'use client';
// import { useState, useEffect } from 'react';
// import axios from 'axios';
// import {
//   Box, Typography, Button, Chip, IconButton,
//   Alert, CircularProgress, Grid, Dialog, DialogTitle,
//   DialogContent, Tooltip, Divider,
// } from '@mui/material';
// import SyncIcon             from '@mui/icons-material/Sync';
// import ExtensionIcon        from '@mui/icons-material/Extension';
// import CloseIcon            from '@mui/icons-material/Close';
// import AddIcon              from '@mui/icons-material/Add';
// import EditIcon             from '@mui/icons-material/Edit';
// import DeleteIcon           from '@mui/icons-material/Delete';
// import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';

// import integrationApi          from './integrationApi';
// import BuiltInProviderForm     from './BuiltInProviderForm';
// import CustomIntegrationDialog from './CustomIntegrationDialog';
// import { BUILT_IN_PROVIDERS, TYPE_COLORS } from './providerMeta';
// import ProviderCard             from './ProviderCard';

// // ── Custom tool card, restyled to match the built-in provider tiles ──────────
// function CustomToolCard({ item, onToggle, onEdit, onDelete }) {
//   return (
//     <Box
//       sx={{
//         border: '1px solid #e8edf2',
//         borderRadius: '16px',
//         p: 3,
//         background: '#fff',
//         height: '100%',
//         display: 'flex',
//         flexDirection: 'column',
//         gap: 2,
//         opacity: item.status === 'INACTIVE' ? 0.6 : 1,
//         transition: 'box-shadow 0.2s ease, transform 0.15s ease, opacity 0.2s ease',
//         '&:hover': { boxShadow: '0 8px 24px rgba(15,23,42,0.07)', transform: 'translateY(-2px)' },
//       }}
//     >
//       <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
//         <Box
//           sx={{
//             width: 56, height: 56, borderRadius: '14px',
//             background: '#6366f116', display: 'flex',
//             alignItems: 'center', justifyContent: 'center', flexShrink: 0,
//           }}
//         >
//           <ExtensionIcon sx={{ fontSize: 26, color: '#6366f1' }} />
//         </Box>
//         <Chip
//           label={item.status}
//           size="small"
//           color={item.status === 'ACTIVE' ? 'success' : 'default'}
//           sx={{ height: 24, fontSize: '0.7rem', fontWeight: 600 }}
//         />
//       </Box>

//       <Box sx={{ flex: 1 }}>
//         <Typography fontWeight={700} fontSize="1rem" color="text.primary" mb={0.5} noWrap>
//           {item.name}
//         </Typography>
//         {item.description ? (
//           <Typography variant="body2" color="text.secondary" sx={{
//             lineHeight: 1.5, overflow: 'hidden',
//             display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
//           }}>
//             {item.description}
//           </Typography>
//         ) : (
//           <Typography variant="body2" color="text.secondary">
//             {item.baseUrl || 'Custom integration'}
//           </Typography>
//         )}
//         <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1.25 }}>
//           <Chip label={item.type} size="small" color={TYPE_COLORS[item.type] ?? 'default'} variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
//           <Chip label={item.authType} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
//         </Box>
//       </Box>

//       <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
//         <Button
//           onClick={() => onEdit(item)}
//           variant="outlined"
//           startIcon={<EditIcon sx={{ fontSize: 16 }} />}
//           sx={{
//             textTransform: 'none', fontWeight: 600, borderRadius: '8px',
//             fontSize: '0.85rem', borderColor: '#e2e8f0', color: 'text.primary',
//           }}
//         >
//           Configure
//         </Button>
//         <Tooltip title={item.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
//           <IconButton size="small" onClick={() => onToggle(item.id)} sx={{ color: item.status === 'ACTIVE' ? '#22c55e' : 'text.disabled' }}>
//             <PowerSettingsNewIcon sx={{ fontSize: 18 }} />
//           </IconButton>
//         </Tooltip>
//         <Tooltip title="Delete">
//           <IconButton size="small" onClick={() => onDelete(item.id, item.name)} sx={{ color: '#ef4444', ml: 'auto' }}>
//             <DeleteIcon sx={{ fontSize: 18 }} />
//           </IconButton>
//         </Tooltip>
//       </Box>
//     </Box>
//   );
// }

// // ── "Add a custom tool" tile, dashed outline, sits at the end of the grid ────
// function AddCustomTile({ onClick }) {
//   return (
//     <Box
//       onClick={onClick}
//       sx={{
//         border: '2px dashed #d8dee6',
//         borderRadius: '16px',
//         p: 3,
//         height: '100%',
//         minHeight: 220,
//         display: 'flex',
//         flexDirection: 'column',
//         alignItems: 'center',
//         justifyContent: 'center',
//         gap: 1.25,
//         cursor: 'pointer',
//         color: 'text.secondary',
//         transition: 'border-color 0.15s ease, background 0.15s ease, color 0.15s ease',
//         '&:hover': { borderColor: '#6366f1', background: '#6366f108', color: '#6366f1' },
//       }}
//     >
//       <AddIcon sx={{ fontSize: 28 }} />
//       <Typography fontWeight={600} fontSize="0.9rem">Add a custom tool</Typography>
//       <Typography variant="caption" color="text.disabled" textAlign="center">
//         Okta, Salesforce, or any other service
//       </Typography>
//     </Box>
//   );
// }

// // ── Main page ─────────────────────────────────────────────────────────────────
// export default function IntegrationsPage() {

//   // ── Resolve tenantId the same way RiskAssessmentTable does ───────────────
//   // Read from sessionStorage cache first (already set by compliance page),
//   // otherwise fetch from user-service. Never use JWT.organization directly
//   // because that is the MongoDB _id, not the tenantId string.
//   const [tenantId,  setTenantId]  = useState(null);
//   const [tenantErr, setTenantErr] = useState(false);

//   useEffect(() => {
//     const resolve = async () => {
//       const cached = sessionStorage.getItem('tenantId');
//       if (cached) { setTenantId(cached); return; }

//       try {
//         const user  = JSON.parse(sessionStorage.getItem('user') || '{}');
//         const orgId = user?.organization?._id ?? user?.organization;
//         if (!orgId) { setTenantErr(true); return; }

//         const res = await axios.get(
//           `https://api.calvant.com/user-service/api/organizations/${orgId}/tenant`,
//           { headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` } }
//         );
//         const tid = res.data;
//         sessionStorage.setItem('tenantId', tid);
//         setTenantId(tid);
//       } catch (err) {
//         console.error('Failed to resolve tenantId:', err);
//         setTenantErr(true);
//       }
//     };
//     resolve();
//   }, []);

//   const [builtInConfig, setBuiltInConfig] = useState({});
//   const [customList,    setCustomList]    = useState([]);
//   const [loading,       setLoading]       = useState(true);
//   const [syncing,       setSyncing]       = useState(false);
//   const [syncAlert,     setSyncAlert]     = useState(null);

//   // Built-in provider config dialog
//   const [configProviderKey, setConfigProviderKey] = useState(null);
//   const configOpen = !!configProviderKey;
//   const configProvider = BUILT_IN_PROVIDERS.find(p => p.key === configProviderKey) ?? null;

//   // Custom tool dialog (unchanged behavior, just re-used here)
//   const [customDialogOpen, setCustomDialogOpen] = useState(false);
//   const [editingCustom,    setEditingCustom]    = useState(null);

//   useEffect(() => { if (tenantId) loadAll(); }, [tenantId]);

//   const loadAll = async () => {
//     setLoading(true);
//     try {
//       const [config, customs] = await Promise.all([
//         integrationApi.getBuiltInConfig(tenantId),
//         integrationApi.getAllCustom(tenantId),
//       ]);
//       setBuiltInConfig(config ?? {});
//       setCustomList(Array.isArray(customs) ? customs : customs?.data ?? customs?.items ?? []);
//     } catch {
//       setSyncAlert({ type: 'error', message: 'Failed to load integrations.' });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Built-in handlers
//   const handleSave = async (provider, payload) => {
//     const data = await integrationApi.saveBuiltIn(tenantId, provider, payload);
//     if (data.success) await loadAll();
//     return data;
//   };
//   const handleRemove = async (provider) => {
//     if (!confirm(`Disconnect ${provider.toUpperCase()}?`)) return;
//     await integrationApi.removeBuiltIn(tenantId, provider);
//     await loadAll();
//     setConfigProviderKey(null);
//   };
//   const handleTest = async (provider) => integrationApi.testBuiltIn(tenantId, provider);

//   // Custom handlers
//   const handleCustomSubmit = async (form, id) => {
//     if (id) await integrationApi.updateCustom(tenantId, id, form);
//     else    await integrationApi.createCustom(tenantId, form);
//     setCustomDialogOpen(false);
//     setEditingCustom(null);
//     await loadAll();
//   };
//   const handleCustomDelete = async (id, name) => {
//     if (!confirm(`Remove "${name}"?`)) return;
//     await integrationApi.deleteCustom(tenantId, id);
//     await loadAll();
//   };
//   const handleToggle = async (id) => {
//     await integrationApi.toggleCustom(tenantId, id);
//     await loadAll();
//   };

//   // Sync
//   const handleSync = async () => {
//     setSyncing(true);
//     setSyncAlert(null);
//     try {
//       await integrationApi.triggerSync(tenantId);
//       setSyncAlert({ type: 'success', message: 'Compliance sync completed successfully.' });
//     } catch {
//       setSyncAlert({ type: 'error', message: 'Sync failed. Please try again.' });
//     } finally {
//       setSyncing(false);
//     }
//   };

//   // ── Guards ────────────────────────────────────────────────────────────────
//   if (tenantErr) return (
//     <Box sx={{ p: 4 }}>
//       <Alert severity="error">Could not resolve tenant. Please log in again.</Alert>
//     </Box>
//   );

//   if (!tenantId || loading) return (
//     <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
//       <CircularProgress size={32} />
//     </Box>
//   );

//   const connectedBuiltIn = BUILT_IN_PROVIDERS.filter(p => !!builtInConfig[p.configKey ?? p.key]).length;
//   const activeCustom     = customList.filter(c => c.status === 'ACTIVE').length;
//   const totalConnected   = connectedBuiltIn + activeCustom;

//   return (
//     <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>

//       {/* Page header */}
//       <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
//         <Box>
//           <Typography variant="h5" fontWeight={800} color="text.primary" letterSpacing="-0.3px">
//             Integrations
//           </Typography>
//           <Typography variant="body2" color="text.secondary" mt={0.5}>
//             Connect your cloud, HR, and security tools. Credentials are encrypted before storage.
//           </Typography>
//         </Box>
//         <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
//           <Chip
//             label={`${totalConnected} active`}
//             size="small"
//             color={totalConnected > 0 ? 'success' : 'default'}
//             sx={{ fontWeight: 600, fontSize: '0.75rem' }}
//           />
//           <Button
//             variant="contained"
//             startIcon={syncing ? <CircularProgress size={14} color="inherit" /> : <SyncIcon />}
//             onClick={handleSync}
//             disabled={syncing || totalConnected === 0}
//             size="small"
//             sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px', fontSize: '0.82rem' }}
//           >
//             {syncing ? 'Syncing…' : 'Run compliance sync'}
//           </Button>
//         </Box>
//       </Box>

//       {syncAlert && (
//         <Alert severity={syncAlert.type} sx={{ mb: 3, borderRadius: '10px' }} onClose={() => setSyncAlert(null)}>
//           {syncAlert.message}
//         </Alert>
//       )}

//       {/* Built-in providers */}
//       <Typography variant="subtitle2" fontWeight={700} color="text.disabled" sx={{ letterSpacing: '0.06em', fontSize: '0.72rem', mb: 1.5 }}>
//         BUILT-IN TOOLS
//       </Typography>
//       <Grid container spacing={2.5} sx={{ mb: 4 }}>
//         {BUILT_IN_PROVIDERS.map(provider => (
//           <Grid item xs={12} sm={6} md={4} key={provider.key}>
//             <ProviderCard
//               icon={provider.Icon}
//               accent={provider.accent}
//               label={provider.label}
//               description={provider.description}
//               isConnected={!!builtInConfig[provider.configKey ?? provider.key]}
//               onOpen={() => setConfigProviderKey(provider.key)}
//             />
//           </Grid>
//         ))}
//       </Grid>

//       <Divider sx={{ mb: 4 }} />

//       {/* Custom tools */}
//       <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
//         <Typography variant="subtitle2" fontWeight={700} color="text.disabled" sx={{ letterSpacing: '0.06em', fontSize: '0.72rem' }}>
//           CUSTOM TOOLS
//         </Typography>
//         {customList.length > 0 && (
//           <Chip label={customList.length} size="small" color="primary" sx={{ height: 20, fontSize: '0.65rem' }} />
//         )}
//       </Box>
//       <Grid container spacing={2.5}>
//         {customList.map(item => (
//           <Grid item xs={12} sm={6} md={4} key={item.id}>
//             <CustomToolCard
//               item={item}
//               onToggle={handleToggle}
//               onEdit={(i) => { setEditingCustom(i); setCustomDialogOpen(true); }}
//               onDelete={handleCustomDelete}
//             />
//           </Grid>
//         ))}
//         <Grid item xs={12} sm={6} md={4}>
//           <AddCustomTile onClick={() => { setEditingCustom(null); setCustomDialogOpen(true); }} />
//         </Grid>
//       </Grid>

//       {/* ── Built-in provider config dialog ──────────────────────────────── */}
//       <Dialog
//         open={configOpen}
//         onClose={() => setConfigProviderKey(null)}
//         maxWidth="sm"
//         fullWidth
//         PaperProps={{ sx: { borderRadius: '14px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' } }}
//       >
//         {configProvider && (
//           <>
//             <DialogTitle sx={{
//               display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//               pb: 1.5, borderBottom: '1px solid #f1f5f9',
//             }}>
//               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//                 <Box sx={{
//                   width: 40, height: 40, borderRadius: '10px',
//                   background: `${configProvider.accent}16`,
//                   display: 'flex', alignItems: 'center', justifyContent: 'center',
//                 }}>
//                   <configProvider.Icon sx={{ fontSize: 20, color: configProvider.accent }} />
//                 </Box>
//                 <Box>
//                   <Typography fontWeight={700} fontSize="1rem" color="text.primary">
//                     {configProvider.label}
//                   </Typography>
//                   <Typography variant="caption" color="text.secondary">
//                     {configProvider.description}
//                   </Typography>
//                 </Box>
//               </Box>
//               <IconButton size="small" onClick={() => setConfigProviderKey(null)} sx={{ color: 'text.secondary' }}>
//                 <CloseIcon fontSize="small" />
//               </IconButton>
//             </DialogTitle>

//             <DialogContent sx={{ pt: 3 }}>
//               <BuiltInProviderForm
//                 providerKey={configProvider.key}
//                 configKey={configProvider.configKey ?? configProvider.key}
//                 savedConfig={builtInConfig}
//                 onSave={handleSave}
//                 onRemove={handleRemove}
//                 onTest={handleTest}
//               />
//             </DialogContent>
//           </>
//         )}
//       </Dialog>

//       {/* ── Custom tool dialog (unchanged) ───────────────────────────────── */}
//       <CustomIntegrationDialog
//         open={customDialogOpen}
//         onClose={() => { setCustomDialogOpen(false); setEditingCustom(null); }}
//         onSubmit={handleCustomSubmit}
//         editing={editingCustom}
//       />
//     </Box>
//   );
// }

// src/modules/admin/components/Integrations/IntegrationsPage.jsx
'use client';
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Box, Typography, Button, Chip, IconButton,
  Alert, CircularProgress, Grid, Dialog, DialogTitle,
  DialogContent, Tooltip, Divider,
} from '@mui/material';
import SyncIcon             from '@mui/icons-material/Sync';
import ExtensionIcon        from '@mui/icons-material/Extension';
import CloseIcon            from '@mui/icons-material/Close';
import AddIcon              from '@mui/icons-material/Add';
import EditIcon             from '@mui/icons-material/Edit';
import DeleteIcon           from '@mui/icons-material/Delete';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';

import integrationApi          from './integrationApi';
import BuiltInProviderForm     from './BuiltInProviderForm';
import CustomIntegrationDialog from './CustomIntegrationDialog';
import { BUILT_IN_PROVIDERS, TYPE_COLORS } from './providerMeta';
import ProviderCard             from './ProviderCard';

// ── Custom tool card, restyled to match the built-in provider tiles ──────────
function CustomToolCard({ item, onToggle, onEdit, onDelete }) {
  return (
    <Box
      sx={{
        border: '1px solid #e8edf2',
        borderRadius: '16px',
        p: 3,
        background: '#fff',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        opacity: item.status === 'INACTIVE' ? 0.6 : 1,
        transition: 'box-shadow 0.2s ease, transform 0.15s ease, opacity 0.2s ease',
        '&:hover': { boxShadow: '0 8px 24px rgba(15,23,42,0.07)', transform: 'translateY(-2px)' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box
          sx={{
            width: 56, height: 56, borderRadius: '14px',
            background: '#6366f116', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <ExtensionIcon sx={{ fontSize: 26, color: '#6366f1' }} />
        </Box>
        <Chip
          label={item.status}
          size="small"
          color={item.status === 'ACTIVE' ? 'success' : 'default'}
          sx={{ height: 24, fontSize: '0.7rem', fontWeight: 600 }}
        />
      </Box>

      <Box sx={{ flex: 1 }}>
        <Typography fontWeight={700} fontSize="1rem" color="text.primary" mb={0.5} noWrap>
          {item.name}
        </Typography>
        {item.description ? (
          <Typography variant="body2" color="text.secondary" sx={{
            lineHeight: 1.5, overflow: 'hidden',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {item.description}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {item.baseUrl || 'Custom integration'}
          </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1.25 }}>
          <Chip label={item.type} size="small" color={TYPE_COLORS[item.type] ?? 'default'} variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
          <Chip label={item.authType} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
        <Button
          onClick={() => onEdit(item)}
          variant="outlined"
          startIcon={<EditIcon sx={{ fontSize: 16 }} />}
          sx={{
            textTransform: 'none', fontWeight: 600, borderRadius: '8px',
            fontSize: '0.85rem', borderColor: '#e2e8f0', color: 'text.primary',
          }}
        >
          Configure
        </Button>
        <Tooltip title={item.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
          <IconButton size="small" onClick={() => onToggle(item.id)} sx={{ color: item.status === 'ACTIVE' ? '#22c55e' : 'text.disabled' }}>
            <PowerSettingsNewIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" onClick={() => onDelete(item.id, item.name)} sx={{ color: '#ef4444', ml: 'auto' }}>
            <DeleteIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

// ── Small logo tile for the config dialog header, same fallback as ProviderCard ──
const LOGO_EXTENSIONS = ['svg', 'png', 'webp'];
function buildLogoCandidates(logoUrl) {
  if (!logoUrl) return [];
  const withoutExt = logoUrl.replace(/\.(svg|png|webp|jpe?g)$/i, '');
  return LOGO_EXTENSIONS.map(ext => `${withoutExt}.${ext}`);
}

function DialogLogo({ logoUrl, Icon, accent, label }) {
  const candidates = useMemo(() => buildLogoCandidates(logoUrl), [logoUrl]);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const showRealLogo = candidateIndex < candidates.length;
  return (
    <Box sx={{
      width: 44, height: 44, borderRadius: '10px',
      background: showRealLogo ? '#fff' : `${accent}16`,
      border: showRealLogo ? '1px solid #f1f3f6' : 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    }}>
      {showRealLogo ? (
        <Box component="img" src={candidates[candidateIndex]} alt={`${label} logo`} onError={() => setCandidateIndex(i => i + 1)} sx={{ width: 30, height: 30, objectFit: 'contain' }} />
      ) : (
        <Icon sx={{ fontSize: 20, color: accent }} />
      )}
    </Box>
  );
}

// ── "Add a custom tool" tile, dashed outline, sits at the end of the grid ────
function AddCustomTile({ onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        border: '2px dashed #d8dee6',
        borderRadius: '16px',
        p: 3,
        height: '100%',
        minHeight: 220,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.25,
        cursor: 'pointer',
        color: 'text.secondary',
        transition: 'border-color 0.15s ease, background 0.15s ease, color 0.15s ease',
        '&:hover': { borderColor: '#6366f1', background: '#6366f108', color: '#6366f1' },
      }}
    >
      <AddIcon sx={{ fontSize: 28 }} />
      <Typography fontWeight={600} fontSize="0.9rem">Add a custom tool</Typography>
      <Typography variant="caption" color="text.disabled" textAlign="center">
        Okta, Salesforce, or any other service
      </Typography>
    </Box>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function IntegrationsPage() {

  // ── Resolve tenantId the same way RiskAssessmentTable does ───────────────
  // Read from sessionStorage cache first (already set by compliance page),
  // otherwise fetch from user-service. Never use JWT.organization directly
  // because that is the MongoDB _id, not the tenantId string.
  const [tenantId,  setTenantId]  = useState(null);
  const [tenantErr, setTenantErr] = useState(false);

  useEffect(() => {
    const resolve = async () => {
      const cached = sessionStorage.getItem('tenantId');
      if (cached) { setTenantId(cached); return; }

      try {
        const user  = JSON.parse(sessionStorage.getItem('user') || '{}');
        const orgId = user?.organization?._id ?? user?.organization;
        if (!orgId) { setTenantErr(true); return; }

        const res = await axios.get(
          `https://api.calvant.com/user-service/api/organizations/${orgId}/tenant`,
          { headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` } }
        );
        const tid = res.data;
        sessionStorage.setItem('tenantId', tid);
        setTenantId(tid);
      } catch (err) {
        console.error('Failed to resolve tenantId:', err);
        setTenantErr(true);
      }
    };
    resolve();
  }, []);

  const [builtInConfig, setBuiltInConfig] = useState({});
  const [customList,    setCustomList]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [syncing,       setSyncing]       = useState(false);
  const [syncAlert,     setSyncAlert]     = useState(null);

  // Built-in provider config dialog
  const [configProviderKey, setConfigProviderKey] = useState(null);
  const configOpen = !!configProviderKey;
  const configProvider = BUILT_IN_PROVIDERS.find(p => p.key === configProviderKey) ?? null;

  // Custom tool dialog (unchanged behavior, just re-used here)
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [editingCustom,    setEditingCustom]    = useState(null);

  useEffect(() => { if (tenantId) loadAll(); }, [tenantId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [config, customs] = await Promise.all([
        integrationApi.getBuiltInConfig(tenantId),
        integrationApi.getAllCustom(tenantId),
      ]);
      setBuiltInConfig(config ?? {});
      setCustomList(Array.isArray(customs) ? customs : customs?.data ?? customs?.items ?? []);
    } catch {
      setSyncAlert({ type: 'error', message: 'Failed to load integrations.' });
    } finally {
      setLoading(false);
    }
  };

  // Built-in handlers
  const handleSave = async (provider, payload) => {
    const data = await integrationApi.saveBuiltIn(tenantId, provider, payload);
    if (data.success) await loadAll();
    return data;
  };
  const handleRemove = async (provider) => {
    if (!confirm(`Disconnect ${provider.toUpperCase()}?`)) return;
    await integrationApi.removeBuiltIn(tenantId, provider);
    await loadAll();
    setConfigProviderKey(null);
  };
  const handleTest = async (provider) => integrationApi.testBuiltIn(tenantId, provider);

  // Custom handlers
  const handleCustomSubmit = async (form, id) => {
    if (id) await integrationApi.updateCustom(tenantId, id, form);
    else    await integrationApi.createCustom(tenantId, form);
    setCustomDialogOpen(false);
    setEditingCustom(null);
    await loadAll();
  };
  const handleCustomDelete = async (id, name) => {
    if (!confirm(`Remove "${name}"?`)) return;
    await integrationApi.deleteCustom(tenantId, id);
    await loadAll();
  };
  const handleToggle = async (id) => {
    await integrationApi.toggleCustom(tenantId, id);
    await loadAll();
  };

  // Sync
  const handleSync = async () => {
    setSyncing(true);
    setSyncAlert(null);
    try {
      await integrationApi.triggerSync(tenantId);
      setSyncAlert({ type: 'success', message: 'Compliance sync completed successfully.' });
    } catch {
      setSyncAlert({ type: 'error', message: 'Sync failed. Please try again.' });
    } finally {
      setSyncing(false);
    }
  };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (tenantErr) return (
    <Box sx={{ p: 4 }}>
      <Alert severity="error">Could not resolve tenant. Please log in again.</Alert>
    </Box>
  );

  if (!tenantId || loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
      <CircularProgress size={32} />
    </Box>
  );

  const connectedBuiltIn = BUILT_IN_PROVIDERS.filter(p => !!builtInConfig[p.configKey ?? p.key]).length;
  const activeCustom     = customList.filter(c => c.status === 'ACTIVE').length;
  const totalConnected   = connectedBuiltIn + activeCustom;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>

      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} color="text.primary" letterSpacing="-0.3px">
            Integrations
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Connect your cloud, HR, and security tools. Credentials are encrypted before storage.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Chip
            label={`${totalConnected} active`}
            size="small"
            color={totalConnected > 0 ? 'success' : 'default'}
            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
          />
          <Button
            variant="contained"
            startIcon={syncing ? <CircularProgress size={14} color="inherit" /> : <SyncIcon />}
            onClick={handleSync}
            disabled={syncing || totalConnected === 0}
            size="small"
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px', fontSize: '0.82rem' }}
          >
            {syncing ? 'Syncing…' : 'Run compliance sync'}
          </Button>
        </Box>
      </Box>

      {syncAlert && (
        <Alert severity={syncAlert.type} sx={{ mb: 3, borderRadius: '10px' }} onClose={() => setSyncAlert(null)}>
          {syncAlert.message}
        </Alert>
      )}

      {/* Built-in providers */}
      <Typography variant="subtitle2" fontWeight={700} color="text.disabled" sx={{ letterSpacing: '0.06em', fontSize: '0.72rem', mb: 1.5 }}>
        BUILT-IN TOOLS
      </Typography>
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {[...BUILT_IN_PROVIDERS].sort((a, b) => a.label.localeCompare(b.label)).map(provider => (
          <Grid item xs={12} sm={6} md={4} key={provider.key}>
            <ProviderCard
              icon={provider.Icon}
              logoUrl={provider.logoUrl}
              accent={provider.accent}
              label={provider.label}
              description={provider.description}
              isConnected={!!builtInConfig[provider.configKey ?? provider.key]}
              onOpen={() => setConfigProviderKey(provider.key)}
            />
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ mb: 4 }} />

      {/* Custom tools */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={700} color="text.disabled" sx={{ letterSpacing: '0.06em', fontSize: '0.72rem' }}>
          CUSTOM TOOLS
        </Typography>
        {customList.length > 0 && (
          <Chip label={customList.length} size="small" color="primary" sx={{ height: 20, fontSize: '0.65rem' }} />
        )}
      </Box>
      <Grid container spacing={2.5}>
        {customList.map(item => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <CustomToolCard
              item={item}
              onToggle={handleToggle}
              onEdit={(i) => { setEditingCustom(i); setCustomDialogOpen(true); }}
              onDelete={handleCustomDelete}
            />
          </Grid>
        ))}
        <Grid item xs={12} sm={6} md={4}>
          <AddCustomTile onClick={() => { setEditingCustom(null); setCustomDialogOpen(true); }} />
        </Grid>
      </Grid>

      {/* ── Built-in provider config dialog ──────────────────────────────── */}
      <Dialog
        open={configOpen}
        onClose={() => setConfigProviderKey(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '14px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' } }}
      >
        {configProvider && (
          <>
            <DialogTitle sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              pb: 1.5, borderBottom: '1px solid #f1f5f9',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <DialogLogo
                  key={configProvider.key}
                  logoUrl={configProvider.logoUrl}
                  Icon={configProvider.Icon}
                  accent={configProvider.accent}
                  label={configProvider.label}
                />
                <Box>
                  <Typography fontWeight={700} fontSize="1rem" color="text.primary">
                    {configProvider.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {configProvider.description}
                  </Typography>
                </Box>
              </Box>
              <IconButton size="small" onClick={() => setConfigProviderKey(null)} sx={{ color: 'text.secondary' }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
              <BuiltInProviderForm
                providerKey={configProvider.key}
                configKey={configProvider.configKey ?? configProvider.key}
                savedConfig={builtInConfig}
                onSave={handleSave}
                onRemove={handleRemove}
                onTest={handleTest}
              />
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* ── Custom tool dialog (unchanged) ───────────────────────────────── */}
      <CustomIntegrationDialog
        open={customDialogOpen}
        onClose={() => { setCustomDialogOpen(false); setEditingCustom(null); }}
        onSubmit={handleCustomSubmit}
        editing={editingCustom}
      />
    </Box>
  );
}