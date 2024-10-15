import { useEffect, useState } from "react";
import { FieldAppSDK } from "@contentful/app-sdk";
import { Link } from "contentful-management";

const useCheckedCategories = (sdk: FieldAppSDK) => {
  const [checkedCategories, setCheckedCategories] = useState<string[]>([]);

  useEffect(() => {
    const existingValue = (sdk.field.getValue() || []) as Link<"Entry">[];
    const existingIds = existingValue.map((ref) => ref.sys.id);
    setCheckedCategories(existingIds);

    const detach = sdk.field.onValueChanged((value) => {
      const existingIds = ((value || []) as Link<"Entry">[]).map(
        (ref) => ref.sys.id
      );
      setCheckedCategories(existingIds);
    });

    return () => {
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

  return { checkedCategories, handleCheck };
};

export default useCheckedCategories;
