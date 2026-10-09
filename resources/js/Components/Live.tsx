import FriendToast from '@/Components/FriendToast';
import { embedded } from '@/lib/embed';
import WhisperToast from '@/Components/WhisperToast';

/** Everything that can pop up live on any page: friend requests and whispers. */
export default function Live() {
    if (embedded) return null; // the room underneath shows these

    return (
        <>
            <FriendToast />
            <WhisperToast />
        </>
    );
}
