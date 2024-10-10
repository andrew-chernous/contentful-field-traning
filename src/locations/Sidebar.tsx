import React, { useState, useEffect } from 'react';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { readingTime } from '../lib/utils/reading-time.util';
import { List, ListItem, Note } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { documentToPlainTextString } from '@contentful/rich-text-plain-text-renderer';

const CONTENT_FIELD_ID = 'body';

const Sidebar = () => {
    const sdk = useSDK<SidebarAppSDK>();
    const contentField = sdk.entry.fields[CONTENT_FIELD_ID];

    // Get the initial plain text from the rich text document
    const [blogText, setBlogText] = useState(documentToPlainTextString(contentField.getValue() || {}));
    const stats = readingTime(blogText || '');

    useEffect(() => {
        const detach = contentField.onValueChanged((value) => {
            // Convert the rich text document to plain text
            setBlogText(documentToPlainTextString(value || {}));
        });
        return () => detach();
    }, [contentField]);

    return (
        <>
            <Note style={{ marginBottom: '12px' }}>
                Metrics for your blog post:
                <List style={{ marginTop: '12px' }}>
                    <ListItem>Word count: {stats.words}</ListItem>
                    <ListItem>Reading time: {stats.text}</ListItem>
                </List>
            </Note>
        </>
    );
};

export default Sidebar;
