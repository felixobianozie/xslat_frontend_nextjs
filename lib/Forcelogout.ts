import { redirect } from "next/navigation";

const forceLogout = async () => {
  redirect("/logout");
};

export default forceLogout;
