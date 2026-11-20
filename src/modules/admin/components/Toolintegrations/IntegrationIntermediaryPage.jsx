'use client';

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Chip,
  CircularProgress,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import CloseIcon from '@mui/icons-material/Close';
import {
  Shield, Globe, Lock, Key, FileText, Settings, Rocket, Handshake,
  Scale, User, Users, Puzzle, CheckCircle, CheckCircle2, AlertTriangle,
  Database, Server, BarChart, TrendingUp, Award, Star, Zap,
  ShieldCheck, Clock, Bell, FileSpreadsheet, Laptop, Cloud,
  ShieldAlert, Activity, HeartPulse, Cpu, Info, Check, ExternalLink,
  Layers, Search, Maximize2
} from 'lucide-react';
import './integration-intermediary.css';

// Localhost development endpoint (ACTIVE):
// const API_BASE = 'http://localhost:4036/api/integration-content';

// Live Production endpoint (FALLBACK):
const API_BASE =
  //   process.env.NEXT_PUBLIC_INTEGRATION_CONTENT_API ||
  'https://api.calvant.com/integration-content-service/api/integration-content';

// Everything before /api/integration-content
// e.g. https://api.calvant.com/integration-content-service
const SERVICE_BASE = API_BASE.replace(/\/api\/integration-content\/?$/, '');

export function resolveImageUrl(url) {
  if (!url) return '';
  if (/^(https?:|data:)/i.test(url)) return url;
  return `${SERVICE_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}
const ICON_MAP = {
  Shield, Globe, Lock, Key, FileText, Settings, Rocket, Handshake,
  Scale, User, Users, Puzzle, CheckCircle, CheckCircle2, AlertTriangle,
  Database, Server, BarChart, TrendingUp, Award, Star, Zap,
  ShieldCheck, Clock, Bell, FileSpreadsheet, Laptop, Cloud,
  ShieldAlert, Activity, HeartPulse, Cpu, Info, Check, ExternalLink,
  Layers, Search
};

const DynamicIcon = ({ name, size = 22 }) => {
  if (!name || name === 'None') return null;
  const Icon = ICON_MAP[name] || ShieldCheck;
  return <Icon size={size} />;
};

const LOGO_EXTENSIONS = ['svg', 'png', 'webp'];
function buildLogoCandidates(logoUrl) {
  if (!logoUrl) return [];
  const withoutExt = logoUrl.replace(/\.(svg|png|webp|jpe?g)$/i, '');
  return LOGO_EXTENSIONS.map(ext => `${withoutExt}.${ext}`);
}

function getDefaultContent(provider) {
  const key = (provider?.key || 'aws').toLowerCase();
  const name = provider?.label || provider?.shortLabel || 'Integration';

  if (key === 'aws') {
    return {
      heroBadge: 'INTEGRATION OVERVIEW · CLOUD INFRASTRUCTURE',
      heroTitle: 'Automated AWS compliance evidence,',
      heroHighlight: 'straight from your cloud account',
      heroDescription: 'Connect your AWS account to CalVant and we collect timestamped compliance evidence directly from AWS APIs, with no manual exports or screenshots. Evidence maps to ISO 27001 controls, with additional coverage for ISO 27701 and ISO 42001.',
      heroImageUrl: '/api/integration-content/images/aws-1792991546671.png',
      heroCtaText: 'Connect AWS Account',
      heroStats: [],
      overviewBadge: '01 · WHY CONNECT AWS',
      overviewTitle: 'Continuous Evidence, Zero Manual Screenshots',
      overviewDescription: 'CalVant replaces manual screenshots and spreadsheet trackers with automated, continuous API interrogations across your cloud footprint.',
      pillars: [
        { title: 'Proof for Auditors', description: 'Give auditors proof of IAM, logging and encryption without manual exports or screenshots.', icon: 'ShieldCheck' },
        { title: 'Proactive Misconfiguration Detection', description: 'Surface misconfigurations tied to compliance gaps before they become findings or incidents.', icon: 'AlertTriangle' },
        { title: 'Continuous Timestamped Records', description: 'Maintain timestamped records that show controls operating continuously across audit cycles.', icon: 'Clock' },
      ],
      prerequisitesTitle: 'Before you connect (prerequisites)',
      prerequisitesDescription: 'Some evidence only appears if the AWS service is enabled in your account: GuardDuty, Security Hub, Inspector, Macie, AWS Config and AWS Backup. Access is read-only through a cross-account role.',
      prerequisitesList: [
        'Read-only cross-account IAM role with AWS managed SecurityAudit policy',
        'Required services enabled: GuardDuty, Security Hub, Inspector, Macie, AWS Config, and AWS Backup',
        'Multi-region CloudTrail enabled with management events logging',
        'Zero agent installation or modifications to running workloads',
      ],
      collectionTitle: 'What CalVant collects from AWS',
      collectionDescription: 'Timestamped compliance evidence collected directly from AWS APIs, mapping to ISO 27001 controls, with additional coverage for ISO 27701 and ISO 42001.',
      evidenceCategories: [
        {
          title: 'Identity & Access',
          services: 'IAM, IAM Identity Center',
          icon: 'Users',
          items: [
            'IAM user inventory with creation date and last password use',
            'MFA coverage across IAM users',
            'Account password policy: length, complexity, expiry, reuse prevention',
            'Privileged and administrator users and roles',
            'Admin-policy users as a share of all users (RBAC check)',
            'Segregation-of-duties review of IAM role policies',
            'Inactive IAM users (no activity for 90+ days)',
            'IAM credential report snapshot (access keys, MFA status)',
          ],
        },
        {
          title: 'Logging & Audit',
          services: 'CloudTrail, CloudWatch Logs',
          icon: 'FileText',
          items: [
            'CloudTrail status and recent management events',
            'Configuration-change tracking against approved change windows',
            'Cross-environment access events and AWS Organizations / SCP validation',
            'CloudWatch log group enablement and retention coverage',
          ],
        },
        {
          title: 'Threat Detection & Incident Response',
          services: 'GuardDuty, Security Hub',
          icon: 'ShieldAlert',
          items: [
            'GuardDuty threat findings',
            'Malware-related findings and protection coverage',
            'Security Hub findings, incident counts and mean time to resolve',
            'Monthly incident report',
          ],
        },
        {
          title: 'Data Protection',
          services: 'S3, KMS, ACM, Macie',
          icon: 'Lock',
          items: [
            'KMS key and ACM certificate compliance checks',
            'S3 bucket encryption status',
            'S3 lifecycle and Object Lock retention coverage',
            'Macie sensitive-data (PII) findings',
            'Evidence-bucket file counts for incident documentation',
          ],
        },
        {
          title: 'Vulnerability Management',
          services: 'Amazon Inspector',
          icon: 'AlertTriangle',
          items: [
            'Vulnerability findings with severity, CVE and remediation guidance',
            'Remediation status against SLA',
          ],
        },
        {
          title: 'Monitoring, Capacity & Availability',
          services: 'CloudWatch, EC2',
          icon: 'Activity',
          items: [
            'CloudWatch capacity alarms and active capacity incidents',
            'Monitoring coverage across critical metrics',
            'EC2 uptime and performance metrics',
          ],
        },
        {
          title: 'Backup & Continuity',
          services: 'AWS Backup',
          icon: 'Database',
          items: [
            'Backup plans and job completion rate',
            'Monthly backup success',
            'Disaster-recovery test evidence',
          ],
        },
        {
          title: 'Asset Inventory & Configuration',
          services: 'AWS Config, EC2',
          icon: 'Server',
          items: [
            'Discovered AWS resource inventory',
            'Config rule compliance against baseline',
            'Snapshot and volume review for secure disposal',
          ],
        },
        {
          title: 'Supplier Monitoring',
          services: 'AWS Health',
          icon: 'HeartPulse',
          items: [
            'AWS service health events for supplier monitoring',
          ],
        },
        {
          title: 'AI Governance (ISO 42001)',
          services: 'IAM, CloudWatch, S3',
          icon: 'Cpu',
          items: [
            'AI role definitions in IAM',
            'AI data resource inventory',
            'AI monitoring dashboards in CloudWatch',
            'AI documentation coverage through tagged S3 resources',
          ],
        },
      ],
      workflowBadge: '03 · HOW IT WORKS',
      workflowTitle: 'From Setup to Compliance in Minutes',
      workflowDescription: 'Deploy our read-only cross-account IAM role in minutes with zero agent overhead.',
      workflowSteps: [
        {
          title: 'Create Read-Only IAM Role',
          description: 'Deploy the CalVant CloudFormation stack or attach the AWS-managed SecurityAudit policy to a cross-account role.',
          bulletPoints: ['Scoped strictly to read-only security audit permissions', 'Configured with unique external ID for defense-in-depth', 'One-click connection test'],
        },
        {
          title: 'Automated AWS Discovery Scan',
          description: 'CalVant interrogates enabled services (IAM, CloudTrail, Security Hub, S3, Inspector, Config, Backup) to establish compliance baselines.',
          bulletPoints: ['Initial baseline complete in under 5 minutes', 'Identifies immediate control gaps and misconfigurations', 'Tags resources by risk level'],
        },
        {
          title: 'Continuous Evidence Collection',
          description: 'Hourly syncs generate timestamped cryptographic evidence mapped to ISO 27001, ISO 27701, and ISO 42001.',
          bulletPoints: ['Real-time auditor portal access', 'Zero manual screenshots needed', 'Weekly drift notifications'],
        },
      ],
      complianceTitle: 'Compliance Frameworks Mapped',
      complianceDescription: 'Evidence collected directly from AWS satisfies automated audit controls across global standards:',
      frameworks: ['ISO 27001:2022', 'ISO 27701 (Privacy)', 'ISO 42001 (AI Governance)', 'SOC 2 Type II', 'HIPAA Security Rule', 'NIST CSF 2.0'],
      evidenceCollected: [
        'IAM user, role and credential report snapshots',
        'CloudTrail multi-region management event streams',
        'KMS key rotation and S3 bucket encryption configurations',
        'GuardDuty and Security Hub findings with MTTR metrics',
        'Amazon Inspector vulnerability findings and SLA tracking',
        'AWS Backup job completions and disaster recovery test evidence',
      ],
      securityTitle: 'Enterprise-Grade Security Architecture',
      securityDescription: 'Your AWS environment is protected by least-privilege, read-only security protocols.',
      securityPillars: [
        { title: 'Zero Mutation Guarantee', description: 'CalVant connects using strictly read-only policies (SecurityAudit). We never alter resource configurations.', icon: 'Shield' },
        { title: 'Tenant KMS Encryption', description: 'Role credentials and audit tokens are encrypted using customer tenant KMS keys before storage.', icon: 'Key' },
        { title: 'Audited Infrastructure', description: 'CalVant is SOC 2 Type II and ISO 27001 certified with continuous third-party penetration testing.', icon: 'Award' },
      ],
      faqTitle: 'Frequently Asked Questions',
      faqs: [
        { question: 'What AWS permissions does CalVant require?', answer: 'CalVant requires read-only access via the AWS-managed "SecurityAudit" policy and minimal describe permissions. CalVant never writes to or alters your AWS resources.' },
        { question: 'How often does compliance evidence sync?', answer: 'Evidence syncs automatically every hour. You can also trigger an instant on-demand sync from the CalVant integrations dashboard.' },
        { question: 'What if certain AWS services are disabled?', answer: 'Some evidence only appears if services like GuardDuty, Security Hub, Inspector, Macie, Config, or Backup are enabled. CalVant will highlight disabled services as recommendations.' },
      ],
      footerHeadline: 'Ready to automate AWS compliance?',
      footerDescription: 'Connect in minutes and let CalVant continuously gather timestamped audit evidence.',
      footerCtaText: 'Connect AWS Now',
    };
  }

  // Generic standardized template for any other provider
  return {
    heroBadge: `INTEGRATION OVERVIEW · ${name.toUpperCase()}`,
    heroTitle: `Connect ${name} for Automated`,
    heroHighlight: 'Continuous Compliance',
    heroDescription: `CalVant seamlessly connects with ${name} via secure read-only APIs to continuously monitor configurations, detect security misconfigurations, and collect audit-ready evidence automatically across your compliance frameworks.`,
    heroImageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2940&auto=format&fit=crop',
    heroCtaText: `Connect ${name}`,
    heroStats: [],
    overviewBadge: `01 · WHY CONNECT ${name.toUpperCase()}`,
    overviewTitle: 'Streamline Security Operations & Audit Prep',
    overviewDescription: `Eliminate manual screenshots and spreadsheet trackers. Integrating ${name} provides comprehensive visibility into your security posture with real-time risk alerts and verifiable evidence.`,
    pillars: [
      { title: 'Continuous Evidence Collection', description: 'Automated snapshots of your configurations, policies, and access logs mapped directly to audit controls.', icon: 'Database' },
      { title: 'Real-time Drift Detection', description: 'Instant notifications when access privileges change, encryption is disabled, or security controls fail.', icon: 'AlertTriangle' },
      { title: 'Multi-Framework Mapping', description: 'Single scan feeds evidence across ISO 27001, SOC 2, HIPAA, GDPR, and NIST CSF frameworks simultaneously.', icon: 'ShieldCheck' },
      { title: 'Read-Only & Encrypted', description: 'Zero-privilege architecture. CalVant never modifies your production environment or stores unencrypted credentials.', icon: 'Lock' },
    ],
    prerequisitesTitle: 'Before you connect (prerequisites)',
    prerequisitesDescription: `Verify administrative access in ${name} to authorize API scopes or generate an integration token.`,
    prerequisitesList: [
      `Administrator privileges in ${name} to authorize API scopes`,
      'Read-only audit permissions enabled',
      'Zero agent installation required',
    ],
    collectionTitle: `What CalVant collects from ${name}`,
    collectionDescription: `Automated compliance evidence gathered directly through ${name} APIs:`,
    evidenceCategories: [
      {
        title: 'Identity & Access Governance',
        services: `${name} IAM / Directory`,
        icon: 'Users',
        items: [
          'Active user directory and privileged administrator list',
          'MFA enrollment and enforcement status',
          'Password policy and session timeout settings',
          'Inactive account identification (90+ days without activity)',
        ],
      },
      {
        title: 'Audit Logging & Monitoring',
        services: `${name} Event Logs`,
        icon: 'FileText',
        items: [
          'Administrative action audit trail snapshots',
          'Configuration change events and timestamp verification',
          'Log retention policy compliance proof',
        ],
      },
      {
        title: 'Security Configurations',
        services: `${name} Settings`,
        icon: 'ShieldCheck',
        items: [
          'Encryption in transit and at rest configuration proof',
          'Access control lists and sharing permission baselines',
          'Third-party application integration authorizations',
        ],
      },
    ],
    featuresBadge: '02 · CORE CAPABILITIES',
    featuresTitle: `Comprehensive Inspection Across ${name}`,
    featuresDescription: `CalVant monitors critical security surfaces in ${name} to verify compliance with enterprise security baselines.`,
    features: [
      { title: 'Access & Identity Governance', description: 'Verifies Multi-Factor Authentication (MFA), inactive user offboarding, and privileged access rights.', icon: 'Users', tag: 'IAM' },
      { title: 'Encryption & Data Protection', description: 'Monitors data encryption at rest and in transit, verifying TLS configurations and cryptographic strength.', icon: 'Key', tag: 'DATA SEC' },
      { title: 'Audit Logging & Monitoring', description: 'Ensures comprehensive audit trail retention, integrity monitoring, and alerting pipeline health.', icon: 'FileText', tag: 'AUDIT' },
      { title: 'Vulnerability & Patch Tracking', description: 'Correlates discovered vulnerabilities with internal asset inventories and control ownership.', icon: 'Shield', tag: 'RISK' },
    ],
    workflowBadge: '03 · HOW IT WORKS',
    workflowTitle: 'From Setup to Compliance in Minutes',
    workflowDescription: 'Get started in 3 simple steps without deploying heavy agents or changing code.',
    workflowSteps: [
      { title: 'Authorize Read-Only API Access', description: 'Provide your API credentials, OAuth token, or role ARN with least-privilege read permissions.', bulletPoints: ['Encrypted in transit and rest using AES-256', 'Scoped strictly to security audit metadata', 'Verify connection with one-click test'] },
      { title: 'Automated Configuration Scan', description: 'CalVant discovers assets, interrogates configurations against standard benchmarks, and benchmarks posture.', bulletPoints: ['Initial comprehensive baseline scan completes in minutes', 'Identifies immediate compliance gaps', 'Assigns severity to findings'] },
      { title: 'Continuous Monitoring & Evidence Generation', description: 'Hourly automated syncs keep evidence fresh and auditor-ready with timestamped cryptographic hashes.', bulletPoints: ['Auditor dashboard updated in real-time', 'Zero manual screenshots needed', 'Weekly drift summary reports'] },
    ],
    complianceTitle: 'Supported Compliance Frameworks',
    complianceDescription: `Connecting ${name} satisfies automated controls across leading global standards:`,
    frameworks: ['ISO 27001:2022', 'SOC 2 Type II', 'GDPR', 'HIPAA', 'NIST CSF', 'PCI DSS v4.0'],
    evidenceCollected: [
      'User Access Control Lists & MFA Enforcement Status',
      'Cryptographic Keys & Secret Rotation Timestamps',
      'Configuration Baseline Compliance Reports',
      'Centralized Audit Log Ingestion Proof',
      'Incident & Security Alert Response Tracking'
    ],
    securityTitle: 'Enterprise-Grade Security Architecture',
    securityDescription: 'Your credentials and corporate infrastructure are safeguarded by strict enterprise security protocols.',
    securityPillars: [
      { title: 'Zero Mutation Guarantee', description: 'CalVant connects using strictly read-only scopes. We never alter configuration states or execute commands.', icon: 'Shield' },
      { title: 'Hardware-Grade KMS Encryption', description: 'Tokens and keys are encrypted using AWS KMS with unique customer tenant keys before storage.', icon: 'Key' },
      { title: 'Audited & Certified Infrastructure', description: 'Our platform complies with SOC 2 Type II and ISO 27001 standards with regular third-party penetration testing.', icon: 'Award' },
    ],
    footerHeadline: `Ready to automate ${name} compliance?`,
    footerDescription: 'Connect in minutes and let CalVant continuously gather audit-ready evidence.',
    footerCtaText: `Connect ${name} Now`,
  };
}

export default function IntegrationIntermediaryPage({
  provider,
  isConnected,
  onConnect,
  onBack,
  atCap,
}) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [previewImgOpen, setPreviewImgOpen] = useState(false);

  const providerKey = (provider?.key || 'aws').toLowerCase();
  const providerLabel = provider?.label || provider?.shortLabel || 'Integration';
  const ProviderIcon = provider?.Icon;
  const accent = provider?.accent || '#4f46e5';

  const logoCandidates = useMemo(() => buildLogoCandidates(provider?.logoUrl), [provider?.logoUrl]);
  const [logoIdx, setLogoIdx] = useState(0);
  const showLogo = logoCandidates.length > 0 && logoIdx < logoCandidates.length;

  useEffect(() => {
    let isMounted = true;
    const fetchContent = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/content/${providerKey}`);
        if (isMounted && res.data) {
          setContent(res.data);
          setIsUsingFallback(false);
        }
      } catch (err) {
        console.warn('integration-content-service offline or unreachable, using default template:', err?.message);
        if (isMounted) {
          setContent(getDefaultContent(provider));
          setIsUsingFallback(true);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchContent();
    return () => {
      isMounted = false;
    };
  }, [providerKey, provider]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400, background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <CircularProgress size={36} sx={{ color: '#4f46e5' }} />
      </Box>
    );
  }

  const data = content || getDefaultContent(provider);
  const connectBlocked = !isConnected && atCap;
  const heroImgSrc = resolveImageUrl(data.heroImageUrl) || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2940&auto=format&fit=crop';

  return (
    <div className="int-root">
      <div className="int-container">

        {/* ── Top Bar: Back, Provider Identity & Status ── */}
        <div className="int-back-bar">
          <div className="int-header-left">
            <button type="button" className="int-back-btn" onClick={onBack}>
              <ArrowBackIcon sx={{ fontSize: 16 }} /> Back to Integrations
            </button>

            <div className="int-header-provider-badge">
              <div className="int-header-logo-box">
                {showLogo ? (
                  <img
                    src={logoCandidates[logoIdx]}
                    alt={`${providerLabel} logo`}
                    className="int-header-logo-img"
                    onError={() => setLogoIdx(i => i + 1)}
                  />
                ) : ProviderIcon ? (
                  <ProviderIcon sx={{ fontSize: 20, color: accent }} />
                ) : (
                  <ShieldCheck size={18} color={accent} />
                )}
              </div>
              <Typography fontWeight={700} fontSize="0.95rem" color="text.primary">
                {providerLabel}
              </Typography>
            </div>
          </div>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Chip
              icon={isConnected ? <CheckCircleIcon sx={{ fontSize: '15px !important', color: '#15803d !important' }} /> : undefined}
              label={isConnected ? 'CONNECTED & ACTIVE' : 'AVAILABLE TO CONNECT'}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: '0.72rem',
                letterSpacing: '0.04em',
                background: isConnected ? '#dcfce7' : '#f1f5f9',
                color: isConnected ? '#15803d' : '#475569',
                border: isConnected ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
              }}
            />
            {connectBlocked && (
              <Chip
                icon={<LockIcon sx={{ fontSize: '14px !important', color: '#b45309 !important' }} />}
                label="Slot Limit Reached"
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  background: '#fef3c7',
                  color: '#b45309',
                  border: '1px solid #fde68a',
                }}
              />
            )}
          </Box>
        </div>

        {/* ── 1. HERO SECTION ── */}
        <section className="int-hero-section">
          <div>
            <div className="int-badge">
              {data.heroBadge || `INTEGRATION OVERVIEW · ${providerLabel.toUpperCase()}`}
            </div>

            <h1 className="int-hero-title">
              {data.heroTitle || `Connect ${providerLabel} for Automated`}{' '}
              <span className="int-highlight">
                {data.heroHighlight || 'Continuous Compliance'}
              </span>
            </h1>

            <p className="int-lead">
              {data.heroDescription ||
                `CalVant continuously monitors ${providerLabel} configurations, IAM permissions, and audit logs to automatically gather verifiable compliance evidence across ISO 27001, SOC 2, and global standards.`}
            </p>

            <div className="int-cta-row">
              <button
                type="button"
                className="int-primary-btn"
                onClick={onConnect}
                disabled={connectBlocked}
                style={connectBlocked ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              >
                {isConnected ? <CheckCircle size={18} /> : <Rocket size={18} />}
                {isConnected
                  ? 'Manage Connection / Credentials'
                  : connectBlocked
                    ? 'Slot Limit Reached (Upgrade Plan)'
                    : data.heroCtaText || `Connect ${providerLabel}`}
              </button>


            </div>


          </div>

          {/* Hero Visual Box */}
          <div
            className="int-hero-visual"
            onClick={() => data.heroImageUrl && setPreviewImgOpen(true)}
            title="Click to view full architecture diagram"
          >
            <img
              src={heroImgSrc}
              crossOrigin="anonymous"
              alt={`${providerLabel} Overview`}
              className="int-hero-img"
            />
            {data.heroImageUrl && (
              <div className="int-hero-expand-badge">
                <Maximize2 size={12} /> Expand Diagram
              </div>
            )}
          </div>
        </section>

        {/* ── 2. OVERVIEW & PILLARS (WHY CONNECT) ── */}
        {data.pillars && data.pillars.length > 0 && (
          <section className="int-section">
            <div className="int-section-header">
              <div className="int-section-tag">
                {data.overviewBadge || `01 · WHY CONNECT ${providerLabel.toUpperCase()}`}
              </div>
              <h2 className="int-section-title">
                {data.overviewTitle || 'Streamline Security Operations & Audit Prep'}
              </h2>
              {data.overviewDescription && (
                <p className="int-section-desc">{data.overviewDescription}</p>
              )}
            </div>

            <div className="int-pillars-grid">
              {data.pillars.map((pil, idx) => (
                <div key={idx} className="int-card">
                  <div className="int-card-icon-box">
                    <DynamicIcon name={pil.icon} size={22} />
                  </div>
                  <h3 className="int-card-title">{pil.title}</h3>
                  <p className="int-card-desc">{pil.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 3. BEFORE YOU CONNECT (PREREQUISITES) ── */}
        {(data.prerequisitesTitle || data.prerequisitesDescription || (data.prerequisitesList && data.prerequisitesList.length > 0)) && (
          <section className="int-prerequisites-section">
            <div className="int-prerequisites-card">
              <div className="int-prerequisites-header">
                <div className="int-prerequisites-icon-box">
                  <Info size={22} color="#0284c7" />
                </div>
                <div>
                  <div className="int-prerequisites-badge">PREREQUISITES & SCOPES</div>
                  <h3 className="int-prerequisites-title">
                    {data.prerequisitesTitle || 'Before you connect (prerequisites)'}
                  </h3>
                  {data.prerequisitesDescription && (
                    <p className="int-prerequisites-desc">{data.prerequisitesDescription}</p>
                  )}
                </div>
              </div>

              {data.prerequisitesList && data.prerequisitesList.length > 0 && (
                <div className="int-prerequisites-list">
                  {data.prerequisitesList.map((req, rIdx) => (
                    <div key={rIdx} className="int-prerequisite-item">
                      <CheckCircle2 size={16} color="#0284c7" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>{req}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── 4. WHAT CALVANT COLLECTS (EVIDENCE MATRIX) ── */}
        {data.evidenceCategories && data.evidenceCategories.length > 0 ? (
          <section className="int-section">
            <div className="int-section-header">
              <div className="int-section-tag">
                02 · WHAT CALVANT COLLECTS
              </div>
              <h2 className="int-section-title">
                {data.collectionTitle || `What CalVant collects from ${providerLabel}`}
              </h2>
              {data.collectionDescription && (
                <p className="int-section-desc">{data.collectionDescription}</p>
              )}
            </div>

            <div className="int-evidence-grid">
              {data.evidenceCategories.map((cat, idx) => (
                <div key={idx} className="int-evidence-cat-card">
                  <div className="int-evidence-cat-header">
                    <div className="int-evidence-cat-left">
                      <div className="int-card-icon-box" style={{ marginBottom: 0 }}>
                        <DynamicIcon name={cat.icon || 'ShieldCheck'} size={22} />
                      </div>
                      <div>
                        <h3 className="int-evidence-cat-title">{cat.title}</h3>
                        {cat.services && (
                          <span className="int-evidence-services-badge">{cat.services}</span>
                        )}
                      </div>
                    </div>
                    <span className="int-evidence-count-chip">
                      {cat.items?.length || 0} {cat.items?.length === 1 ? 'Check' : 'Checks'}
                    </span>
                  </div>

                  <ul className="int-evidence-items-list">
                    {(cat.items || []).map((item, iIdx) => (
                      <li key={iIdx} className="int-evidence-item">
                        <CheckCircle2 size={15} color="#16a34a" style={{ flexShrink: 0, marginTop: 3 }} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ) : (
          /* Fallback Features if categories not available */
          data.features && data.features.length > 0 && (
            <section className="int-section">
              <div className="int-section-header">
                <div className="int-section-tag">
                  {data.featuresBadge || '02 · CORE CAPABILITIES'}
                </div>
                <h2 className="int-section-title">
                  {data.featuresTitle || `Comprehensive Inspection Across ${providerLabel}`}
                </h2>
                {data.featuresDescription && (
                  <p className="int-section-desc">{data.featuresDescription}</p>
                )}
              </div>

              <div className="int-pillars-grid">
                {data.features.map((feat, idx) => (
                  <div key={idx} className="int-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div className="int-card-icon-box" style={{ marginBottom: 0 }}>
                        <DynamicIcon name={feat.icon} size={22} />
                      </div>
                      {feat.tag && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4338ca', background: '#eef2ff', border: '1px solid #c7d2fe', padding: '3px 8px', borderRadius: 6 }}>
                          {feat.tag}
                        </span>
                      )}
                    </div>
                    <h3 className="int-card-title">{feat.title}</h3>
                    <p className="int-card-desc">{feat.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )
        )}





        {/* ── 9. FOOTER CTA ── */}
        <section className="int-footer-cta">
          <h2 className="int-footer-title" style={{ color: '#ffffff' }}>
            {data.footerHeadline || `Ready to automate ${providerLabel} compliance?`}
          </h2>
          <p className="int-footer-desc" style={{ color: '#e0e7ff' }}>
            {data.footerDescription ||
              'Connect in minutes and let CalVant continuously gather audit-ready evidence.'}
          </p>
          <button
            type="button"
            className="int-footer-btn"
            onClick={onConnect}
            disabled={connectBlocked}
            style={connectBlocked ? { opacity: 0.6, cursor: 'not-allowed', margin: '0 auto' } : { margin: '0 auto' }}
          >
            {isConnected ? <CheckCircle size={18} /> : <Rocket size={18} />}
            {isConnected
              ? 'Manage Connection / Credentials'
              : data.footerCtaText || `Connect ${providerLabel} Now`}
          </button>
        </section>

      </div>

      {/* ── High-Res Image Preview Dialog ── */}
      <Dialog
        open={previewImgOpen}
        onClose={() => setPreviewImgOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            overflow: 'hidden',
            background: '#0f172a',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, borderBottom: '1px solid #1e293b', color: '#fff' }}>
          <Typography fontWeight={700} fontSize="1rem">
            {providerLabel} Architecture & Evidence Flow
          </Typography>
          <IconButton onClick={() => setPreviewImgOpen(false)} sx={{ color: '#94a3b8' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', minHeight: '60vh' }}>
          <img
            src={heroImgSrc}
            crossOrigin="anonymous"
            alt={providerLabel}
            style={{ maxWidth: '100%', maxHeight: '78vh', objectFit: 'contain', borderRadius: '8px' }}
          />
        </Box>
      </Dialog>
    </div>
  );
}
