// // src/modules/admin/components/Integrations/ProviderCard.jsx
// 'use client';
// import { Box, Typography, Button, Chip } from '@mui/material';
// import CheckCircleIcon from '@mui/icons-material/CheckCircle';
// import SettingsIcon    from '@mui/icons-material/Settings';
// import AddIcon         from '@mui/icons-material/Add';

// // A single tool tile in the grid: logo, name, blurb, status badge,
// // and a Connect / Configure button that opens the config dialog.
// export default function ProviderCard({
//   icon: Icon,
//   accent,
//   label,
//   description,
//   isConnected,
//   onOpen,
// }) {
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
//         transition: 'box-shadow 0.2s ease, transform 0.15s ease',
//         '&:hover': {
//           boxShadow: '0 8px 24px rgba(15,23,42,0.07)',
//           transform: 'translateY(-2px)',
//         },
//       }}
//     >
//       {/* Logo + status */}
//       <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
//         <Box
//           sx={{
//             width: 56,
//             height: 56,
//             borderRadius: '14px',
//             background: `${accent}16`,
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             flexShrink: 0,
//           }}
//         >
//           <Icon sx={{ fontSize: 28, color: accent }} />
//         </Box>

//         {isConnected ? (
//           <Chip
//             icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
//             label="Connected"
//             size="small"
//             sx={{
//               background: '#dcfce7',
//               color: '#15803d',
//               fontWeight: 600,
//               fontSize: '0.7rem',
//               height: 24,
//               '& .MuiChip-icon': { color: '#15803d' },
//             }}
//           />
//         ) : (
//           <Typography
//             variant="caption"
//             color="text.disabled"
//             fontWeight={600}
//             sx={{ mt: 0.75, fontSize: '0.72rem' }}
//           >
//             Available
//           </Typography>
//         )}
//       </Box>

//       {/* Name + description */}
//       <Box sx={{ flex: 1 }}>
//         <Typography fontWeight={700} fontSize="1rem" color="text.primary" mb={0.5}>
//           {label}
//         </Typography>
//         <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
//           {description}
//         </Typography>
//       </Box>

//       {/* Action button */}
//       <Button
//         onClick={onOpen}
//         variant={isConnected ? 'outlined' : 'contained'}
//         startIcon={isConnected ? <SettingsIcon sx={{ fontSize: 16 }} /> : <AddIcon sx={{ fontSize: 16 }} />}
//         sx={
//           isConnected
//             ? {
//                 textTransform: 'none',
//                 fontWeight: 600,
//                 borderRadius: '8px',
//                 fontSize: '0.85rem',
//                 alignSelf: 'flex-start',
//                 borderColor: '#e2e8f0',
//                 color: 'text.primary',
//                 '&:hover': { borderColor: accent, background: `${accent}0d` },
//               }
//             : {
//                 textTransform: 'none',
//                 fontWeight: 600,
//                 borderRadius: '8px',
//                 fontSize: '0.85rem',
//                 alignSelf: 'flex-start',
//                 background: '#0f172a',
//                 '&:hover': { background: '#1e293b' },
//               }
//         }
//       >
//         {isConnected ? 'Configure' : 'Connect'}
//       </Button>
//     </Box>
//   );
// }

// src/modules/admin/components/Integrations/ProviderCard.jsx
'use client';
import { useState, useMemo } from 'react';
import { Box, Typography, Button, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SettingsIcon    from '@mui/icons-material/Settings';
import AddIcon         from '@mui/icons-material/Add';

const LOGO_EXTENSIONS = ['svg', 'png', 'webp'];

// Turns '/logos/aws.svg' (or '/logos/aws', extension omitted) into a list of
// candidate URLs to try in order: ['/logos/aws.svg', '/logos/aws.png', '/logos/aws.webp'].
// This means whatever format you actually saved the logo in just works, without
// having to keep the filename in providerMeta.js perfectly in sync.
function buildLogoCandidates(logoUrl) {
  if (!logoUrl) return [];
  const withoutExt = logoUrl.replace(/\.(svg|png|webp|jpe?g)$/i, '');
  return LOGO_EXTENSIONS.map(ext => `${withoutExt}.${ext}`);
}

// A single tool tile in the grid: logo, name, blurb, status badge,
// and a Connect / Configure button that opens the config dialog.
//
// Logo resolution order:
//   1. Try each candidate extension for logoUrl (svg, then png, then webp)
//   2. If all fail (or no logoUrl given), fall back to the MUI `icon`
export default function ProviderCard({
  icon: Icon,
  logoUrl,
  accent,
  label,
  description,
  isConnected,
  onOpen,
}) {
  const candidates = useMemo(() => buildLogoCandidates(logoUrl), [logoUrl]);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const showRealLogo = candidateIndex < candidates.length;

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
        transition: 'box-shadow 0.2s ease, transform 0.15s ease',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(15,23,42,0.07)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      {/* Logo + status */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '14px',
            background: showRealLogo ? '#fff' : `${accent}16`,
            border: showRealLogo ? '1px solid #f1f3f6' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {showRealLogo ? (
            <Box
              component="img"
              src={candidates[candidateIndex]}
              alt={`${label} logo`}
              onError={() => setCandidateIndex(i => i + 1)}
              sx={{ width: 46, height: 46, objectFit: 'contain' }}
            />
          ) : (
            <Icon sx={{ fontSize: 30, color: accent }} />
          )}
        </Box>

        {isConnected ? (
          <Chip
            icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
            label="Connected"
            size="small"
            sx={{
              background: '#dcfce7',
              color: '#15803d',
              fontWeight: 600,
              fontSize: '0.7rem',
              height: 24,
              '& .MuiChip-icon': { color: '#15803d' },
            }}
          />
        ) : (
          <Typography
            variant="caption"
            color="text.disabled"
            fontWeight={600}
            sx={{ mt: 0.75, fontSize: '0.72rem' }}
          >
            Available
          </Typography>
        )}
      </Box>

      {/* Name + description */}
      <Box sx={{ flex: 1 }}>
        <Typography fontWeight={700} fontSize="1rem" color="text.primary" mb={0.5}>
          {label}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
          {description}
        </Typography>
      </Box>

      {/* Action button */}
      <Button
        onClick={onOpen}
        variant={isConnected ? 'outlined' : 'contained'}
        startIcon={isConnected ? <SettingsIcon sx={{ fontSize: 16 }} /> : <AddIcon sx={{ fontSize: 16 }} />}
        sx={
          isConnected
            ? {
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '8px',
                fontSize: '0.85rem',
                alignSelf: 'flex-start',
                borderColor: '#e2e8f0',
                color: 'text.primary',
                '&:hover': { borderColor: accent, background: `${accent}0d` },
              }
            : {
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '8px',
                fontSize: '0.85rem',
                alignSelf: 'flex-start',
                background: '#0f172a',
                '&:hover': { background: '#1e293b' },
              }
        }
      >
        {isConnected ? 'Configure' : 'Connect'}
      </Button>
    </Box>
  );
}