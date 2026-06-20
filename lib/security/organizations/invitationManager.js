const crypto = require('crypto');

class InvitationManager {
  constructor() {
    this._invitations = new Map();
    this._defaultExpiry = 86400000 * 7;
  }

  create(input) {
    const id = input.id || `inv-${crypto.randomUUID().substring(0, 8)}`;
    const token = crypto.randomBytes(32).toString('hex');
    const invitation = {
      id, token, email: input.email, organizationId: input.organizationId,
      teamId: input.teamId || null, role: input.role || 'viewer',
      invitedBy: input.invitedBy, message: input.message || '',
      status: 'pending', createdAt: Date.now(),
      expiresAt: Date.now() + (input.expiresIn || this._defaultExpiry),
      respondedAt: null
    };
    this._invitations.set(id, invitation);
    return invitation;
  }

  accept(token, userId) {
    const invitation = this.findByToken(token);
    if (!invitation) return { success: false, error: 'Invalid invitation token' };
    if (invitation.status !== 'pending') return { success: false, error: 'Invitation already processed' };
    if (Date.now() > invitation.expiresAt) return { success: false, error: 'Invitation expired' };
    invitation.status = 'accepted';
    invitation.respondedAt = Date.now();
    invitation.acceptedBy = userId;
    return { success: true, invitation };
  }

  decline(token) {
    const invitation = this.findByToken(token);
    if (!invitation) return { success: false, error: 'Invalid invitation token' };
    if (invitation.status !== 'pending') return { success: false, error: 'Invitation already processed' };
    invitation.status = 'declined';
    invitation.respondedAt = Date.now();
    return { success: true, invitation };
  }

  cancel(id) {
    const invitation = this._invitations.get(id);
    if (!invitation) return false;
    if (invitation.status !== 'pending') return false;
    invitation.status = 'cancelled';
    return true;
  }

  get(id) {
    return this._invitations.get(id) || null;
  }

  findByToken(token) {
    for (const inv of this._invitations.values()) {
      if (inv.token === token) return inv;
    }
    return null;
  }

  listByOrganization(orgId) {
    return Array.from(this._invitations.values()).filter(i => i.organizationId === orgId);
  }

  listByEmail(email) {
    return Array.from(this._invitations.values()).filter(i => i.email === email);
  }

  listPending() {
    return Array.from(this._invitations.values()).filter(i => i.status === 'pending' && Date.now() <= i.expiresAt);
  }

  clear() {
    this._invitations.clear();
  }
}

module.exports = { InvitationManager };
