import React, {useCallback, useEffect, useMemo, useState} from "react";
import { useSDK } from "@contentful/react-apps-toolkit";
import { Entry, FieldAppSDK } from "@contentful/app-sdk";
import {
  Form,
  Heading,
  TextInput,
  Paragraph,
  Spinner,
  Badge,
  Checkbox,
  BadgeVariant,
  Box,
} from "@contentful/f36-components";
import SortableTree, {
  TreeItem,
  NodeData,
} from "@nosferatu500/react-sortable-tree";
import "@nosferatu500/react-sortable-tree/style.css";
import { EntryProps, Link } from "contentful-management";
import {
  CategoryEntryFields,
  TreeNode,
} from "../lib/interface/category.interface";
import { getStatus } from "../lib/utils/get-status.util";
import "../styles/category-selection.css";
const Field = () => {
  const sdk = useSDK<FieldAppSDK>();

  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [checkedCategories, setCheckedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      try {
        const response = await sdk.cma.entry.getMany<CategoryEntryFields>({
          query: {
            content_type: "category",
            limit: 1000,
            order: "fields.slug",
          },
        });

        const categoryEntries = response.items as Entry<CategoryEntryFields>[];

        const categoryMap: { [key: string]: TreeNode } = {};

        categoryEntries.forEach((item: EntryProps<CategoryEntryFields>) => {
          const fields = item.fields;
          const defaultLocale = sdk.locales.default;

          const name = fields.title?.[defaultLocale] || "Untitled";
          const parentCategory = fields.parentCategory?.[defaultLocale];
          const parentId = parentCategory ? parentCategory.sys.id : null;

          const status = getStatus(item);

          categoryMap[item.sys.id] = {
            id: item.sys.id,
            title: name,
            parentId: parentId,
            children: [],
            expanded: true,
            status: status,
          };
        });

        const buildHierarchy = () => {
          const roots: TreeNode[] = [];
          const childrenMap: { [key: string]: TreeNode[] } = {};

          Object.values(categoryMap).forEach((category) => {
            const parentId = category.parentId;
            if (parentId) {
              if (!childrenMap[parentId]) {
                childrenMap[parentId] = [];
              }
              childrenMap[parentId].push(category);
            } else {
              roots.push(category);
            }
          });

          Object.keys(childrenMap).forEach((parentId) => {
            if (categoryMap[parentId]) {
              categoryMap[parentId].children = childrenMap[parentId];
            }
          });

          return roots;
        };

        const treeData = buildHierarchy();

        if (isMounted) {
          setTreeData(treeData);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        sdk.notifier.error("Failed to load categories.");
        setIsLoading(false);
      }
    };

    fetchCategories();

    const existingValue = (sdk.field.getValue() || []) as Link<"Entry">[];
    const existingIds = existingValue.map((ref: Link<"Entry">) => ref.sys.id);
    setCheckedCategories(existingIds);

    sdk.window.startAutoResizer();

    const detach = sdk.field.onValueChanged((value) => {
      const existingIds = ((value || []) as Link<"Entry">[]).map(
        (ref: Link<"Entry">) => ref.sys.id
      );
      setCheckedCategories(existingIds);
    });

    return () => {
      isMounted = false;
      detach();
    };
  }, [sdk]);

  const handleCheck = (id: string) => {
    setCheckedCategories((prevChecked) => {
      let newChecked: string[];
      if (prevChecked.includes(id)) {
        newChecked = prevChecked.filter((cid) => cid !== id);
      } else {
        newChecked = [...prevChecked, id];
      }

      const newValue = newChecked.map((cid) => ({
        sys: {
          type: "Link",
          linkType: "Entry",
          id: cid,
        },
      }));

      sdk.field.setValue(newValue);

      return newChecked;
    });
  };

  const statusColors: Record<TreeNode["status"], BadgeVariant> = {
    published: "positive",
    draft: "warning",
    archived: "secondary",
    changed: "primary",
    deleted: "negative",
    new: "primary-filled",
  };

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
      [checkedCategories, handleCheck, statusColors]
  );

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

  const filteredTreeData = useMemo(() => {
    return searchTerm ? filterTree(treeData) : treeData;
  }, [searchTerm, treeData, filterTree]);

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
