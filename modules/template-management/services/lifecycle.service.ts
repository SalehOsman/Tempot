import { AppError } from '@tempot/shared';
import { ok, err, type Result } from 'neverthrow';
import type { Template } from '../types/template.types.js';
import { TemplateStatus } from '../types/template.types.js';
import {
  canTransition,
  checkCompletenessForReview,
  getTransitionPolicy,
} from '../contracts/lifecycle-transitions.js';
import type { TemplateRepository } from '../repositories/template.repository.js';
import type { ModuleEventBus } from '../index.js';
import { TEMPLATE_EVENTS } from '../events/event-names.js';

export interface TransitionRequest {
  templateId: string;
  targetStatus: TemplateStatus;
  userId: string;
  userRole: string;
  isOwner: boolean;
  reason?: string;
}

const ROLE_HIERARCHY = ['GUEST', 'USER', 'ADMIN', 'SUPER_ADMIN'];

export class LifecycleService {
  constructor(
    private readonly templateRepository: TemplateRepository,
    private readonly eventBus: ModuleEventBus,
  ) {}

  async transition(request: TransitionRequest): Promise<Result<Template, AppError>> {
    const templateResult = await this.templateRepository.findById(request.templateId);
    if (templateResult.isErr()) return err(templateResult.error);

    const template = templateResult.value;
    const currentStatus = template.status as TemplateStatus;
    const targetStatus = request.targetStatus;

    const guardErr = this.validateGuards({
      template,
      from: currentStatus,
      to: targetStatus,
      request,
    });
    if (guardErr) return err(guardErr);

    const updateResult = await this.templateRepository.updateStatus(
      request.templateId,
      targetStatus,
    );
    if (updateResult.isErr()) return err(updateResult.error);

    await this.emitStatusChanged(request, currentStatus, targetStatus);
    return ok(updateResult.value);
  }

  private validateGuards(ctx: {
    template: Template;
    from: TemplateStatus;
    to: TemplateStatus;
    request: TransitionRequest;
  }): AppError | null {
    const { template, from, to, request } = ctx;
    if (!canTransition(from, to)) {
      return new AppError('template-management.invalid_transition', { from, to });
    }
    const policy = getTransitionPolicy(from, to);
    if (!policy) return new AppError('template-management.invalid_transition');

    const userIdx = ROLE_HIERARCHY.indexOf(request.userRole);
    const reqIdx = ROLE_HIERARCHY.indexOf(policy.requiredRole);
    if (userIdx < reqIdx) return new AppError('template-management.unauthorized');
    if (policy.ownerOnly && !request.isOwner)
      return new AppError('template-management.unauthorized');
    if (policy.requiresReason && !request.reason)
      return new AppError('template-management.reason_required');

    if (from === TemplateStatus.DRAFT && to === TemplateStatus.REVIEW) {
      const c = checkCompletenessForReview(template);
      if (!c.allowed) return new AppError(c.reason ?? 'template-management.incomplete');
    }
    return null;
  }

  private async emitStatusChanged(
    request: TransitionRequest,
    oldStatus: TemplateStatus,
    newStatus: TemplateStatus,
  ): Promise<void> {
    await this.eventBus.publish(TEMPLATE_EVENTS.STATUS_CHANGED, {
      templateId: request.templateId,
      oldStatus,
      newStatus,
      changedBy: request.userId,
      reason: request.reason,
      timestamp: new Date(),
    });
  }
}
