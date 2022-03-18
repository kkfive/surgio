// tslint:disable:no-expression-statement
import test from 'ava';

import {
  NodeTypeEnum,
  ShadowsocksNodeConfig,
  SimpleNodeConfig,
  VmessNodeConfig,
} from '../../types';
import * as utils from '../index';
import {
  ERR_INVALID_FILTER,
  PROXY_TEST_INTERVAL,
  PROXY_TEST_URL,
} from '../../constant';
import * as filter from '../filter';

test('getNodeNames', async (t) => {
  const nodeNameList: ReadonlyArray<SimpleNodeConfig> = [
    {
      type: NodeTypeEnum.Shadowsocks,
      enable: true,
      nodeName: 'Test Node 1',
    },
    {
      type: NodeTypeEnum.Shadowsocks,
      enable: false,
      nodeName: 'Test Node 2',
    },
    {
      type: NodeTypeEnum.Snell,
      enable: true,
      nodeName: 'Test Node 3',
    },
  ];
  const txt1 = utils.getNodeNames(nodeNameList);
  const txt2 = utils.getNodeNames(nodeNameList, undefined, ':');
  const txt3 = utils.getNodeNames(
    nodeNameList,
    (simpleNodeConfig) => simpleNodeConfig.nodeName !== 'Test Node 3',
  );

  t.is(txt1, 'Test Node 1, Test Node 3');
  t.is(txt2, 'Test Node 1:Test Node 3');
  t.is(txt3, 'Test Node 1');
});

test('getShadowsocksNodes', async (t) => {
  const nodeList: ReadonlyArray<ShadowsocksNodeConfig> = [
    {
      nodeName: '🇭🇰HK(Example)',
      type: NodeTypeEnum.Shadowsocks,
      hostname: 'example.com',
      port: '8443',
      method: 'chacha20-ietf-poly1305',
      password: 'password',
      obfs: 'tls',
      'obfs-host': 'gateway.icloud.com',
      'udp-relay': true,
    },
  ];
  const txt1 = utils.getShadowsocksNodes(nodeList, 'GroupName');

  t.is(
    txt1,
    'ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTpwYXNzd29yZA@example.com:8443/?plugin=obfs-local%3Bobfs%3Dtls%3Bobfs-host%3Dgateway.icloud.com&group=GroupName#%F0%9F%87%AD%F0%9F%87%B0HK(Example)',
  );
});

test('getMellowNodes', async (t) => {
  const nodeList: ReadonlyArray<VmessNodeConfig | ShadowsocksNodeConfig> = [
    {
      alterId: '64',
      host: 'example.com',
      hostname: '1.1.1.1',
      method: 'auto',
      network: 'ws',
      nodeName: 'Test Node 3',
      path: '/',
      port: 8080,
      tls: false,
      skipCertVerify: false,
      type: NodeTypeEnum.Vmess,
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
    },
    {
      alterId: '64',
      host: 'example.com',
      hostname: '1.1.1.1',
      method: 'auto',
      network: 'ws',
      nodeName: 'Test Node 3',
      path: '/',
      port: 8080,
      tls: true,
      skipCertVerify: true,
      type: NodeTypeEnum.Vmess,
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      wsHeaders: {
        foo: 'bar',
      },
    },
    {
      alterId: '64',
      host: '',
      hostname: '1.1.1.1',
      method: 'auto',
      network: 'tcp',
      nodeName: 'Test Node 4',
      path: '/',
      port: 8080,
      tls: false,
      type: NodeTypeEnum.Vmess,
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
    },
    {
      alterId: '64',
      host: '',
      hostname: '1.1.1.1',
      method: 'auto',
      network: 'tcp',
      nodeName: 'Test Node 5',
      path: '/',
      port: 8080,
      tls: true,
      type: NodeTypeEnum.Vmess,
      uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
    },
    {
      nodeName: '🇭🇰HK(Example)',
      type: NodeTypeEnum.Shadowsocks,
      hostname: 'example.com',
      port: '8443',
      method: 'chacha20-ietf-poly1305',
      password: 'password',
      obfs: 'tls',
      'obfs-host': 'gateway.icloud.com',
      'udp-relay': true,
    },
  ];

  t.snapshot(utils.getMellowNodes(nodeList));
  t.snapshot(
    utils.getMellowNodes(
      nodeList,
      (nodeConfig) => nodeConfig.nodeName === 'Test Node 5',
    ),
  );
});

test('getDownloadUrl', (t) => {
  t.is(
    utils.getDownloadUrl('http://example.com/', 'test.conf'),
    'http://example.com/test.conf',
  );
  t.is(utils.getDownloadUrl(undefined, 'test.conf'), '/test.conf');
  t.is(utils.getDownloadUrl(undefined, 'test.conf', false), '/test.conf?dl=1');
  t.is(
    utils.getDownloadUrl(undefined, 'test.conf', undefined, 'abcd'),
    '/test.conf?access_token=abcd',
  );
  t.is(
    utils.getDownloadUrl(
      'http://example.com/',
      'test.conf?foo=bar',
      undefined,
      'abcd',
    ),
    'http://example.com/test.conf?foo=bar&access_token=abcd',
  );
});

test('normalizeClashProxyGroupConfig', (t) => {
  function proxyGroupModifier(_, filters): any {
    return [
      {
        name: '🚀 Proxy',
        type: 'select',
      },
      {
        name: '🚀 Proxy 2',
        type: 'select',
        proxies: ['Another Proxy'],
      },
      {
        name: 'US',
        filter: filters.usFilter,
        type: 'url-test',
      },
      {
        name: 'HK',
        filter: filters.hkFilter,
        type: 'url-test',
      },
      {
        name: '🍎 Apple',
        proxies: ['DIRECT', '🚀 Proxy', 'US'],
        type: 'select',
      },
      {
        name: 'Mixed',
        filter: filters.hkFilter,
        proxies: ['DIRECT'],
        type: 'url-test',
      },
      {
        name: 'load-balance',
        filter: filters.hkFilter,
        proxies: ['🚀 Proxy', 'US'],
        type: 'load-balance',
      },
      {
        name: 'fallback-auto',
        filter: filters.hkFilter,
        proxies: ['🚀 Proxy', 'US'],
        type: 'fallback',
      },
      {
        name: 'fallback-auto-no-filter',
        proxies: ['🚀 Proxy', 'US'],
        type: 'fallback',
      },
    ];
  }
  const result = [
    {
      name: '🚀 Proxy',
      type: 'select',
      proxies: ['🇭🇰HK(Example)'],
    },
    {
      name: '🚀 Proxy 2',
      type: 'select',
      proxies: ['Another Proxy'],
    },
    {
      name: 'US',
      type: 'url-test',
      proxies: [],
      url: PROXY_TEST_URL,
      interval: PROXY_TEST_INTERVAL,
    },
    {
      name: 'HK',
      type: 'url-test',
      proxies: ['🇭🇰HK(Example)'],
      url: PROXY_TEST_URL,
      interval: PROXY_TEST_INTERVAL,
    },
    {
      name: '🍎 Apple',
      proxies: ['DIRECT', '🚀 Proxy', 'US'],
      type: 'select',
    },
    {
      name: 'Mixed',
      proxies: ['DIRECT', '🇭🇰HK(Example)'],
      type: 'url-test',
      url: PROXY_TEST_URL,
      interval: PROXY_TEST_INTERVAL,
    },
    {
      name: 'load-balance',
      type: 'load-balance',
      proxies: ['🚀 Proxy', 'US', '🇭🇰HK(Example)'],
      url: PROXY_TEST_URL,
      interval: PROXY_TEST_INTERVAL,
    },
    {
      name: 'fallback-auto',
      type: 'fallback',
      proxies: ['🚀 Proxy', 'US', '🇭🇰HK(Example)'],
      url: PROXY_TEST_URL,
      interval: PROXY_TEST_INTERVAL,
    },
    {
      name: 'fallback-auto-no-filter',
      type: 'fallback',
      proxies: ['🚀 Proxy', 'US'],
      url: PROXY_TEST_URL,
      interval: PROXY_TEST_INTERVAL,
    },
  ];

  t.deepEqual(
    utils.normalizeClashProxyGroupConfig(
      [
        {
          nodeName: '🇭🇰HK(Example)',
          type: NodeTypeEnum.Shadowsocks,
          hostname: 'example.com',
          port: '8443',
          method: 'chacha20-ietf-poly1305',
          password: 'password',
        },
      ],
      {
        hkFilter: filter.hkFilter,
        usFilter: filter.usFilter,
      },
      proxyGroupModifier as any,
      {
        proxyTestUrl: PROXY_TEST_URL,
        proxyTestInterval: PROXY_TEST_INTERVAL,
      },
    ),
    result,
  );
});

test('getShadowsocksJSONConfig', async (t) => {
  const config = await utils.getShadowsocksJSONConfig(
    'http://example.com/gui-config.json?v=1',
    true,
  );
  const config2 = await utils.getShadowsocksJSONConfig(
    'http://example.com/gui-config.json?v=2',
    false,
  );

  t.deepEqual(config[0], {
    nodeName: '🇺🇸US 1',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'us.example.com',
    port: 443,
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    'udp-relay': true,
    obfs: 'tls',
    'obfs-host': 'gateway-carry.icloud.com',
  });
  t.deepEqual(config[1], {
    nodeName: '🇺🇸US 2',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'us.example.com',
    port: 444,
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    'udp-relay': true,
  });
  t.deepEqual(config[2], {
    nodeName: '🇺🇸US 3',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'us.example.com',
    port: 445,
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    'udp-relay': true,
    obfs: 'tls',
    'obfs-host': 'www.bing.com',
  });
  t.deepEqual(config[3], {
    nodeName: '🇺🇸US 4',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'us.example.com',
    port: 80,
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    'udp-relay': true,
    obfs: 'http',
    'obfs-host': 'www.bing.com',
  });
  t.deepEqual(config2[0], {
    nodeName: '🇺🇸US 1',
    type: NodeTypeEnum.Shadowsocks,
    hostname: 'us.example.com',
    port: 443,
    method: 'chacha20-ietf-poly1305',
    password: 'password',
    'udp-relay': false,
    obfs: 'tls',
    'obfs-host': 'gateway-carry.icloud.com',
  });
});

test('getV2rayNNodes', (t) => {
  const schemeList = utils
    .getV2rayNNodes([
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'ws',
        nodeName: '测试 1',
        path: '/',
        port: 8080,
        tls: false,
        host: 'example.com',
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      },
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'tcp',
        nodeName: '测试 2',
        path: '/',
        port: 8080,
        tls: true,
        host: '',
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      },
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'ws',
        nodeName: '测试 3',
        path: '/',
        port: 8080,
        tls: false,
        host: '',
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      },
    ])
    .split('\n');

  t.is(
    schemeList[0],
    'vmess://eyJ2IjoiMiIsInBzIjoi5rWL6K+VIDEiLCJhZGQiOiIxLjEuMS4xIiwicG9ydCI6IjgwODAiLCJpZCI6IjEzODZmODVlLTY1N2ItNGQ2ZS05ZDU2LTc4YmFkYjc1ZTFmZCIsImFpZCI6IjY0IiwibmV0Ijoid3MiLCJ0eXBlIjoibm9uZSIsImhvc3QiOiJleGFtcGxlLmNvbSIsInBhdGgiOiIvIiwidGxzIjoiIn0=',
  );
  t.is(
    schemeList[1],
    'vmess://eyJ2IjoiMiIsInBzIjoi5rWL6K+VIDIiLCJhZGQiOiIxLjEuMS4xIiwicG9ydCI6IjgwODAiLCJpZCI6IjEzODZmODVlLTY1N2ItNGQ2ZS05ZDU2LTc4YmFkYjc1ZTFmZCIsImFpZCI6IjY0IiwibmV0IjoidGNwIiwidHlwZSI6Im5vbmUiLCJob3N0IjoiIiwicGF0aCI6Ii8iLCJ0bHMiOiJ0bHMifQ==',
  );
  t.is(
    schemeList[2],
    'vmess://eyJ2IjoiMiIsInBzIjoi5rWL6K+VIDMiLCJhZGQiOiIxLjEuMS4xIiwicG9ydCI6IjgwODAiLCJpZCI6IjEzODZmODVlLTY1N2ItNGQ2ZS05ZDU2LTc4YmFkYjc1ZTFmZCIsImFpZCI6IjY0IiwibmV0Ijoid3MiLCJ0eXBlIjoibm9uZSIsImhvc3QiOiIiLCJwYXRoIjoiLyIsInRscyI6IiJ9',
  );
});

test('getQuantumultNodes', (t) => {
  const schemeList = utils
    .getQuantumultNodes([
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'ws',
        nodeName: '测试 1',
        path: '/',
        port: 8080,
        tls: false,
        host: 'example.com',
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      },
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'tcp',
        nodeName: '测试 2',
        path: '/',
        port: 8080,
        tls: false,
        host: '',
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      },
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'ws',
        nodeName: '测试 3',
        path: '/',
        port: 8080,
        tls: false,
        host: '',
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      },
      {
        type: NodeTypeEnum.Shadowsocksr,
        nodeName: '🇭🇰HK',
        hostname: 'hk.example.com',
        port: 10000,
        method: 'chacha20-ietf',
        password: 'password',
        obfs: 'tls1.2_ticket_auth',
        obfsparam: 'music.163.com',
        protocol: 'auth_aes128_md5',
        protoparam: '',
      },
      {
        type: NodeTypeEnum.HTTPS,
        nodeName: 'test',
        hostname: 'a.com',
        port: 443,
        username: 'snsms',
        password: 'nndndnd',
      },
      {
        nodeName: '🇺🇸US 1',
        type: NodeTypeEnum.Shadowsocks,
        hostname: 'us.example.com',
        port: 443,
        method: 'chacha20-ietf-poly1305',
        password: 'password',
        'udp-relay': true,
        obfs: 'tls',
        'obfs-host': 'gateway-carry.icloud.com',
      },
    ])
    .split('\n');

  t.is(
    schemeList[0],
    'vmess://5rWL6K+VIDEgPSB2bWVzcywxLjEuMS4xLDgwODAsY2hhY2hhMjAtaWV0Zi1wb2x5MTMwNSwiMTM4NmY4NWUtNjU3Yi00ZDZlLTlkNTYtNzhiYWRiNzVlMWZkIiw2NCxncm91cD1TdXJnaW8sb3Zlci10bHM9ZmFsc2UsY2VydGlmaWNhdGU9MSxvYmZzPXdzLG9iZnMtcGF0aD0iLyIsb2Jmcy1oZWFkZXI9Imhvc3Q6ZXhhbXBsZS5jb21bUnJdW05uXXVzZXItYWdlbnQ6TW96aWxsYS81LjAgKGlQaG9uZTsgQ1BVIGlQaG9uZSBPUyAxM181IGxpa2UgTWFjIE9TIFgpIEFwcGxlV2ViS2l0LzYwNS4xLjE1IChLSFRNTCwgbGlrZSBHZWNrbykgVmVyc2lvbi8xMy4xLjEgTW9iaWxlLzE1RTE0OCBTYWZhcmkvNjA0LjEi',
  );
  t.is(
    schemeList[1],
    'vmess://5rWL6K+VIDIgPSB2bWVzcywxLjEuMS4xLDgwODAsY2hhY2hhMjAtaWV0Zi1wb2x5MTMwNSwiMTM4NmY4NWUtNjU3Yi00ZDZlLTlkNTYtNzhiYWRiNzVlMWZkIiw2NCxncm91cD1TdXJnaW8sb3Zlci10bHM9ZmFsc2UsY2VydGlmaWNhdGU9MSxvYmZzPXRjcCxvYmZzLXBhdGg9Ii8iLG9iZnMtaGVhZGVyPSJob3N0OjEuMS4xLjFbUnJdW05uXXVzZXItYWdlbnQ6TW96aWxsYS81LjAgKGlQaG9uZTsgQ1BVIGlQaG9uZSBPUyAxM181IGxpa2UgTWFjIE9TIFgpIEFwcGxlV2ViS2l0LzYwNS4xLjE1IChLSFRNTCwgbGlrZSBHZWNrbykgVmVyc2lvbi8xMy4xLjEgTW9iaWxlLzE1RTE0OCBTYWZhcmkvNjA0LjEi',
  );
  t.is(
    schemeList[2],
    'vmess://5rWL6K+VIDMgPSB2bWVzcywxLjEuMS4xLDgwODAsY2hhY2hhMjAtaWV0Zi1wb2x5MTMwNSwiMTM4NmY4NWUtNjU3Yi00ZDZlLTlkNTYtNzhiYWRiNzVlMWZkIiw2NCxncm91cD1TdXJnaW8sb3Zlci10bHM9ZmFsc2UsY2VydGlmaWNhdGU9MSxvYmZzPXdzLG9iZnMtcGF0aD0iLyIsb2Jmcy1oZWFkZXI9Imhvc3Q6MS4xLjEuMVtScl1bTm5ddXNlci1hZ2VudDpNb3ppbGxhLzUuMCAoaVBob25lOyBDUFUgaVBob25lIE9TIDEzXzUgbGlrZSBNYWMgT1MgWCkgQXBwbGVXZWJLaXQvNjA1LjEuMTUgKEtIVE1MLCBsaWtlIEdlY2tvKSBWZXJzaW9uLzEzLjEuMSBNb2JpbGUvMTVFMTQ4IFNhZmFyaS82MDQuMSI=',
  );
  t.is(
    schemeList[3],
    'ssr://aGsuZXhhbXBsZS5jb206MTAwMDA6YXV0aF9hZXMxMjhfbWQ1OmNoYWNoYTIwLWlldGY6dGxzMS4yX3RpY2tldF9hdXRoOmNHRnpjM2R2Y21RLz9ncm91cD1VM1Z5WjJsdiZvYmZzcGFyYW09YlhWemFXTXVNVFl6TG1OdmJRJnByb3RvcGFyYW09JnJlbWFya3M9OEotSHJmQ2ZoN0JJU3cmdWRwcG9ydD0wJnVvdD0w',
  );
  t.is(
    schemeList[4],
    'http://dGVzdCA9IGh0dHAsIHVwc3RyZWFtLXByb3h5LWFkZHJlc3M9YS5jb20sIHVwc3RyZWFtLXByb3h5LXBvcnQ9NDQzLCB1cHN0cmVhbS1wcm94eS1hdXRoPXRydWUsIHVwc3RyZWFtLXByb3h5LXVzZXJuYW1lPXNuc21zLCB1cHN0cmVhbS1wcm94eS1wYXNzd29yZD1ubmRuZG5kLCBvdmVyLXRscz10cnVlLCBjZXJ0aWZpY2F0ZT0x',
  );
  t.is(
    schemeList[5],
    'ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTpwYXNzd29yZA@us.example.com:443/?plugin=obfs-local%3Bobfs%3Dtls%3Bobfs-host%3Dgateway-carry.icloud.com&group=Surgio#%F0%9F%87%BA%F0%9F%87%B8US%201',
  );
});

test('getQuantumultNodes with filter', (t) => {
  const schemeList = utils
    .getQuantumultNodes(
      [
        {
          type: NodeTypeEnum.Vmess,
          alterId: '64',
          hostname: '1.1.1.1',
          method: 'auto',
          network: 'ws',
          nodeName: '测试 1',
          path: '/',
          port: 8080,
          tls: false,
          host: 'example.com',
          uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
        },
        {
          type: NodeTypeEnum.Vmess,
          alterId: '64',
          hostname: '1.1.1.1',
          method: 'auto',
          network: 'tcp',
          nodeName: '测试 2',
          path: '/',
          port: 8080,
          tls: false,
          host: '',
          uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
        },
      ],
      undefined,
      (item) => item.nodeName === '测试 1',
    )
    .split('\n');

  t.is(
    schemeList[0],
    'vmess://5rWL6K+VIDEgPSB2bWVzcywxLjEuMS4xLDgwODAsY2hhY2hhMjAtaWV0Zi1wb2x5MTMwNSwiMTM4NmY4NWUtNjU3Yi00ZDZlLTlkNTYtNzhiYWRiNzVlMWZkIiw2NCxncm91cD1TdXJnaW8sb3Zlci10bHM9ZmFsc2UsY2VydGlmaWNhdGU9MSxvYmZzPXdzLG9iZnMtcGF0aD0iLyIsb2Jmcy1oZWFkZXI9Imhvc3Q6ZXhhbXBsZS5jb21bUnJdW05uXXVzZXItYWdlbnQ6TW96aWxsYS81LjAgKGlQaG9uZTsgQ1BVIGlQaG9uZSBPUyAxM181IGxpa2UgTWFjIE9TIFgpIEFwcGxlV2ViS2l0LzYwNS4xLjE1IChLSFRNTCwgbGlrZSBHZWNrbykgVmVyc2lvbi8xMy4xLjEgTW9iaWxlLzE1RTE0OCBTYWZhcmkvNjA0LjEi',
  );
});

test('getQuantumultXNodes', (t) => {
  const schemeList = utils
    .getQuantumultXNodes([
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'ws',
        nodeName: '测试 1',
        path: '/',
        port: 8080,
        tls: false,
        host: 'example.com',
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      },
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'tcp',
        nodeName: '测试 2',
        path: '/',
        port: 8080,
        tls: false,
        host: '',
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      },
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'ws',
        nodeName: '测试 3',
        path: '/',
        port: 8080,
        tls: false,
        host: '',
        'udp-relay': true,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      },
      {
        type: NodeTypeEnum.Shadowsocksr,
        nodeName: '🇭🇰HK',
        hostname: 'hk.example.com',
        port: 10000,
        method: 'chacha20-ietf',
        password: 'password',
        obfs: 'tls1.2_ticket_auth',
        obfsparam: 'music.163.com',
        protocol: 'auth_aes128_md5',
        protoparam: '',
      },
      {
        type: NodeTypeEnum.HTTPS,
        nodeName: 'test',
        hostname: 'a.com',
        port: 443,
        username: 'snsms',
        password: 'nndndnd',
      },
      {
        nodeName: '🇺🇸US 1',
        type: NodeTypeEnum.Shadowsocks,
        hostname: 'us.example.com',
        port: 443,
        method: 'chacha20-ietf-poly1305',
        password: 'password',
        'udp-relay': true,
        obfs: 'tls',
        'obfs-host': 'gateway-carry.icloud.com',
        tfo: true,
      },
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'tcp',
        nodeName: '测试 4',
        port: 443,
        tls: true,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      },
    ])
    .split('\n');

  t.is(
    schemeList[0],
    'vmess=1.1.1.1:8080, method=chacha20-ietf-poly1305, password=1386f85e-657b-4d6e-9d56-78badb75e1fd, aead=false, obfs=ws, obfs-uri=/, obfs-host=example.com, tag=测试 1',
  );
  t.is(
    schemeList[1],
    'vmess=1.1.1.1:8080, method=chacha20-ietf-poly1305, password=1386f85e-657b-4d6e-9d56-78badb75e1fd, aead=false, tag=测试 2',
  );
  t.is(
    schemeList[2],
    'vmess=1.1.1.1:8080, method=chacha20-ietf-poly1305, password=1386f85e-657b-4d6e-9d56-78badb75e1fd, udp-relay=true, aead=false, obfs=ws, obfs-uri=/, obfs-host=1.1.1.1, tag=测试 3',
  );
  t.is(
    schemeList[3],
    'shadowsocks=hk.example.com:10000, method=chacha20-ietf, password=password, ssr-protocol=auth_aes128_md5, ssr-protocol-param=, obfs=tls1.2_ticket_auth, obfs-host=music.163.com, tag=🇭🇰HK',
  );
  t.is(
    schemeList[4],
    'http=a.com:443, username=snsms, password=nndndnd, over-tls=true, tls-verification=true, tag=test',
  );
  t.is(
    schemeList[5],
    'shadowsocks=us.example.com:443, method=chacha20-ietf-poly1305, password=password, obfs=tls, obfs-host=gateway-carry.icloud.com, udp-relay=true, fast-open=true, tag=🇺🇸US 1',
  );
  t.is(
    schemeList[6],
    'vmess=1.1.1.1:443, method=chacha20-ietf-poly1305, password=1386f85e-657b-4d6e-9d56-78badb75e1fd, aead=false, obfs=over-tls, tls-verification=true, tag=测试 4',
  );

  t.is(
    utils.getQuantumultXNodes([
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'tcp',
        nodeName: '测试',
        port: 443,
        tls: true,
        tls13: true,
        'udp-relay': true,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      },
    ]),
    'vmess=1.1.1.1:443, method=chacha20-ietf-poly1305, password=1386f85e-657b-4d6e-9d56-78badb75e1fd, udp-relay=true, aead=false, obfs=over-tls, tls-verification=true, tls13=true, tag=测试',
  );

  t.is(
    utils.getQuantumultXNodes([
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'tcp',
        nodeName: '测试',
        port: 443,
        tls: true,
        tls13: true,
        'udp-relay': true,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
        quantumultXConfig: {
          vmessAEAD: true,
        },
      },
    ]),
    'vmess=1.1.1.1:443, method=chacha20-ietf-poly1305, password=1386f85e-657b-4d6e-9d56-78badb75e1fd, udp-relay=true, aead=true, obfs=over-tls, tls-verification=true, tls13=true, tag=测试',
  );
  t.is(
    utils.getQuantumultXNodes([
      {
        type: NodeTypeEnum.HTTPS,
        nodeName: 'test',
        hostname: 'a.com',
        port: 443,
        tls13: true,
        username: 'snsms',
        password: 'nndndnd',
      },
    ]),
    'http=a.com:443, username=snsms, password=nndndnd, over-tls=true, tls-verification=true, tls13=true, tag=test',
  );
  t.is(
    utils.getQuantumultXNodes([
      {
        type: NodeTypeEnum.Trojan,
        nodeName: 'trojan',
        hostname: 'example.com',
        port: 443,
        password: 'password1',
      },
    ]),
    'trojan=example.com:443, password=password1, over-tls=true, tls-verification=true, tag=trojan',
  );
  t.is(
    utils.getQuantumultXNodes([
      {
        type: NodeTypeEnum.Trojan,
        nodeName: 'trojan',
        hostname: 'example.com',
        port: 443,
        password: 'password1',
        'udp-relay': true,
        skipCertVerify: true,
        tfo: true,
      },
    ]),
    'trojan=example.com:443, password=password1, over-tls=true, tls-verification=false, fast-open=true, udp-relay=true, tag=trojan',
  );
  t.is(
    utils.getQuantumultXNodes([
      {
        type: NodeTypeEnum.Trojan,
        nodeName: 'trojan',
        hostname: 'example.com',
        port: 443,
        password: 'password1',
        sni: 'sni.example.com',
        'udp-relay': true,
        skipCertVerify: true,
        tfo: true,
        tls13: true,
      },
    ]),
    'trojan=example.com:443, password=password1, over-tls=true, tls-verification=false, tls-host=sni.example.com, fast-open=true, udp-relay=true, tls13=true, tag=trojan',
  );
});

test('formatV2rayConfig', (t) => {
  const json = utils.formatV2rayConfig(100, {
    type: NodeTypeEnum.Vmess,
    alterId: '64',
    hostname: '1.1.1.1',
    method: 'auto',
    network: 'ws',
    nodeName: '测试 3',
    path: '/',
    port: 8080,
    tls: false,
    host: '',
    uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
  });
  const json2 = utils.formatV2rayConfig(100, {
    type: NodeTypeEnum.Vmess,
    alterId: '64',
    hostname: '1.1.1.1',
    method: 'auto',
    network: 'ws',
    nodeName: '测试 4',
    path: '/',
    port: 8080,
    tls: true,
    tls13: true,
    skipCertVerify: true,
    host: '',
    uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
  });

  t.deepEqual(json, {
    log: {
      loglevel: 'warning',
    },
    inbound: {
      port: 100,
      listen: '127.0.0.1',
      protocol: 'socks',
      settings: {
        auth: 'noauth',
      },
    },
    outbound: {
      protocol: 'vmess',
      settings: {
        vnext: [
          {
            address: '1.1.1.1',
            port: 8080,
            users: [
              {
                id: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
                alterId: 64,
                security: 'auto',
                level: 0,
              },
            ],
          },
        ],
      },
      streamSettings: {
        network: 'ws',
        security: 'none',
        wsSettings: {
          headers: {
            Host: '',
            'User-Agent':
              'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1',
          },
          path: '/',
        },
      },
    },
  });
  t.deepEqual(json2, {
    log: {
      loglevel: 'warning',
    },
    inbound: {
      port: 100,
      listen: '127.0.0.1',
      protocol: 'socks',
      settings: {
        auth: 'noauth',
      },
    },
    outbound: {
      protocol: 'vmess',
      settings: {
        vnext: [
          {
            address: '1.1.1.1',
            port: 8080,
            users: [
              {
                id: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
                alterId: 64,
                security: 'auto',
                level: 0,
              },
            ],
          },
        ],
      },
      streamSettings: {
        security: 'tls',
        network: 'ws',
        tlsSettings: {
          serverName: '1.1.1.1',
          allowInsecure: true,
          allowInsecureCiphers: false,
        },
        wsSettings: {
          headers: {
            Host: '',
            'User-Agent':
              'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1',
          },
          path: '/',
        },
      },
    },
  });
});

test('output api should fail with invalid filter', (t) => {
  t.throws(
    () => {
      utils.getSurgeNodes([], undefined);
    },
    undefined,
    ERR_INVALID_FILTER,
  );
  t.throws(
    () => {
      utils.getClashNodes([], undefined);
    },
    undefined,
    ERR_INVALID_FILTER,
  );
  t.throws(
    () => {
      utils.getClashNodeNames([], undefined);
    },
    undefined,
    ERR_INVALID_FILTER,
  );
  t.throws(
    () => {
      utils.getNodeNames([], undefined);
    },
    undefined,
    ERR_INVALID_FILTER,
  );
  t.throws(
    () => {
      utils.getQuantumultNodes([], undefined, undefined);
    },
    undefined,
    ERR_INVALID_FILTER,
  );
  t.throws(
    () => {
      utils.getQuantumultXNodes([], undefined);
    },
    undefined,
    ERR_INVALID_FILTER,
  );
  t.throws(
    () => {
      utils.getMellowNodes([], undefined);
    },
    undefined,
    ERR_INVALID_FILTER,
  );
});

test('isIp', (t) => {
  t.true(utils.isIp('0.0.0.0'));
  t.true(utils.isIp('255.255.255.255'));
  t.false(utils.isIp('256.256.256.256'));
  t.false(utils.isIp('example.com'));
});