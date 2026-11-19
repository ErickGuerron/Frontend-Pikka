const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
// apps/shared holds code used by both the web and mobile apps; Metro must watch it to bundle those imports.
const sharedRoot = path.resolve(projectRoot, '../shared');

const config = getDefaultConfig(projectRoot);
config.watchFolders = [...(config.watchFolders ?? []), sharedRoot];

module.exports = config;
