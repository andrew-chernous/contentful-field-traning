import {EntryProps} from "contentful-management";
import {CategoryEntryFields, TreeNode} from "../interface/category.interface";

export const getStatus = (item: EntryProps<CategoryEntryFields>): TreeNode['status'] => {
    const { sys } = item;

    if (sys.archivedAt) {
        return 'archived';
    } else if (!sys.publishedAt) {
        return 'draft';
    } else if (sys.updatedAt && sys.updatedAt !== sys.publishedAt) {
        return 'changed';
    } else if (sys.publishedAt) {
        return 'published';
    }

    return 'new';
};
