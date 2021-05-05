#!/bin/bash

VERSION="$1"

if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
	echo "Invalid version number"
	exit 1
fi

npm version --no-git-tag-version "$VERSION"

header_match="    constructor\(apiKey: string, platform = \"modernmt-node\", platformVersion = "
header_ver="    constructor\(apiKey: string, platform = \"modernmt-node\", platformVersion = \"${VERSION}\"\) {"
sed -i -E "/$header_match/s/.*/$header_ver/" src/modernmt.ts
