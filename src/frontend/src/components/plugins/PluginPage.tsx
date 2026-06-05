import { t } from '@lingui/core/macro';
import { Alert, Stack, Text, Title } from '@mantine/core';
import { IconPlug } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { usePluginUIFeature } from '../../hooks/UsePluginUIFeature';
import { useInvenTreeContext } from './PluginContext';
import type { NavigationUIFeature } from './PluginUIFeatureTypes';
import RemoteComponent from './RemoteComponent';

export default function PluginPage() {
  const { '*': pluginPath } = useParams();

  // Extract the plugin slug from the URL path.
  // pluginPath looks like "bulk-scan/" or "bulk-scan/something/"
  const slug = (pluginPath || '').split('/')[0];

  // Fetch navigation features from plugins
  const navFeatures = usePluginUIFeature<NavigationUIFeature>({
    featureType: 'navigation',
    context: {}
  });

  const [feature, setFeature] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const inventreeContext = useInvenTreeContext();
  const navFeaturesRef = useRef(navFeatures);

  useEffect(() => {
    const prevFeatures = navFeaturesRef.current;
    navFeaturesRef.current = navFeatures;

    if (navFeatures.length > 0) {
      // The hook wraps each feature: { options: {...rawFeature}, func: ... }
      const match = navFeatures.find((f: any) => {
        return f?.options?.plugin_name === slug;
      });
      setFeature(match || null);
      setLoading(false);
    } else if (prevFeatures !== navFeatures) {
      setFeature(null);
      setLoading(false);
    }
  }, [navFeatures, slug]);

  if (loading) {
    return (
      <Stack p='xl'>
        <Text c='dimmed'>{t`Loading plugin…`}</Text>
      </Stack>
    );
  }

  const rawFeature = feature?.options;

  if (!rawFeature) {
    return (
      <Stack p='xl'>
        <Alert color='yellow' icon={<IconPlug />}>
          <Text>{t`Plugin page not found`}</Text>
          <Text size='sm' c='dimmed'>
            {t`No plugin has registered a page at this URL.`}
          </Text>
        </Alert>
      </Stack>
    );
  }

  // Get the source from the raw feature
  const source = rawFeature?.source;

  if (!source) {
    return (
      <Stack p='xl'>
        <Title order={2}>{rawFeature?.title || 'Plugin'}</Title>
        <Alert color='blue'>
          <Text>{t`This plugin does not provide a frontend page.`}</Text>
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack p='md'>
      <Title order={2}>{rawFeature?.title || 'Plugin'}</Title>
      <RemoteComponent
        key={source}
        source={source}
        defaultFunctionName='renderPage'
        context={inventreeContext}
      />
    </Stack>
  );
}
