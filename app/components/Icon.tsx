// ParentComponent.js
import React, { type FC } from "react";

import {
  Mic, femaleIcon, maleIcon
} from "@assets";

interface IconProps {
  name: string;
  width: number;
  height: number;
  iconColor?: string;
}
export const componentMap: any = {
Mic,
femaleIcon,
maleIcon
};

const Icon: FC<IconProps> = ({
  name,
  height,
  width,
  iconColor = "#3162A7",
}) => {
  // Assume you have the sub-component name stored in a variable or state

  // Create a map of component names to actual component references

  const DynamicComponent = componentMap[name];

   
  if (!DynamicComponent) {
    // Handle the case where the component name is not found
    return null;
  }

  return (
    <DynamicComponent width={width} height={height} iconColor={iconColor} />
  );
};

export default Icon;
