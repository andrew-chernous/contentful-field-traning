import {Link} from "contentful-management";
import {TreeItem} from "@nosferatu500/react-sortable-tree";
import {EntityStatus} from "@contentful/f36-components";

export interface CategoryEntryFields {
    title?: { [locale: string]: string };
    slug?: { [locale: string]: string };
    parentCategory?: { [locale: string]: Link<'Entry'> };
}

export interface TreeNode extends Omit<TreeItem, 'title' | 'children'> {
    id: string;
    title: string;
    parentId?: string | null;
    status: EntityStatus;
    isChecked?: boolean;
    children: TreeNode[];
}
