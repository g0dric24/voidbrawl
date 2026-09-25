import { session } from '../../net/session';

export function sendToRoom( type: string, message?: unknown ): void {
    session.room?.send( type, message );
}
