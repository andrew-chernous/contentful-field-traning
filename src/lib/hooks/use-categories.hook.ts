import { useEffect, useState } from "react";
import { EntryProps } from "contentful-management";
import { FieldAppSDK } from "@contentful/app-sdk";
import { Entry } from "@contentful/app-sdk";
import { CategoryEntryFields, TreeNode } from "../interface/category.interface";
import { getStatus } from "../utils/get-status.util";

export const useCategories = (sdk: FieldAppSDK) => {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
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

    return () => {
      isMounted = false;
    };
  }, [sdk]);

  return { treeData, setTreeData, isLoading };
};
