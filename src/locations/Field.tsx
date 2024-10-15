import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSDK } from "@contentful/react-apps-toolkit";
import { FieldAppSDK } from "@contentful/app-sdk";
import {
  Form,
  TextInput,
  Paragraph,
  Spinner,
  Badge,
  Checkbox,
  BadgeVariant,
  Box,
} from "@contentful/f36-components";
import SortableTree, { NodeData } from "@nosferatu500/react-sortable-tree";
import "@nosferatu500/react-sortable-tree/style.css";
import { TreeNode } from "../lib/interface/category.interface";
import "../styles/category-selection.css";
import { useCategories } from "../lib/hooks/use-categories.hook";
import useCheckedCategories from "../lib/hooks/use-checked-categories.hook";
const Field = () => {
  const sdk = useSDK<FieldAppSDK>();

  const { treeData, setTreeData, isLoading } = useCategories(sdk);
  const { checkedCategories, handleCheck } = useCheckedCategories(sdk);
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    sdk.window.startAutoResizer();
  }, [sdk.window]);

  const filterTree = useCallback(
    (nodes: TreeNode[]): TreeNode[] => {
      return nodes
        .map((node) => {
          const children = filterTree(node.children);
          const match =
            node.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            children.length > 0;

          if (match) {
            return {
              ...node,
              children,
            };
          }

          return null;
        })
        .filter((node): node is TreeNode => node !== null);
    },
    [searchTerm]
  );

  const statusColors: Record<TreeNode["status"], BadgeVariant> = {
    published: "positive",
    draft: "warning",
    archived: "secondary",
    changed: "primary",
    deleted: "negative",
    new: "primary-filled",
  };

  const filteredTreeData = useMemo(() => {
    return searchTerm ? filterTree(treeData) : treeData;
  }, [searchTerm, treeData, filterTree]);

  const generateNodeProps = useCallback(
    (rowInfo: NodeData) => {
      const node = rowInfo.node as TreeNode;
      const isChecked = checkedCategories.includes(node.id);
      return {
        title: (
          <div style={{ display: "flex", alignItems: "center" }}>
            <Checkbox
              isChecked={isChecked}
              onChange={() => handleCheck(node.id)}
              id={node.id}
              style={{ marginRight: "8px" }}
            >
              {node.title}
            </Checkbox>
            <Badge
              className="category-badge"
              variant={statusColors[node.status]}
            >
              &nbsp;
            </Badge>
          </div>
        ),
      };
    },
    [checkedCategories, handleCheck]
  );

  return (
    <Box className="category-selection">
      <Form>
        <TextInput
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginBottom: "16px" }}
        />
        {isLoading ? (
          <Spinner />
        ) : treeData.length > 0 ? (
          <div style={{ height: 500 }}>
            <SortableTree
              treeData={filteredTreeData}
              onChange={(data) => setTreeData(data as TreeNode[])}
              generateNodeProps={generateNodeProps}
              canDrag={() => false}
            />
          </div>
        ) : (
          <Paragraph>No categories found.</Paragraph>
        )}
      </Form>
    </Box>
  );
};

export default Field;
