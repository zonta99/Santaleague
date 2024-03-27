import { currentUser } from "@/lib/auth";

const ServerPage = async () => {
    const user = await currentUser();



    return (
<></>
    );
}

export default ServerPage;