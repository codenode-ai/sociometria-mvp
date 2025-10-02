import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  Clock,
  Copy,
  GripVertical,
  Languages,
  Link as LinkIcon,
  ListChecks,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAssessmentsData } from "@/hooks/useAssessments";
import { cn, slugify } from "@/lib/utils";
import type {
  Assessment,
  AssessmentAssignment,
  AssessmentAssignmentStatus,
  AssessmentLink,
  PsychologicalTest,
  SupportedLanguage,
} from "@shared/schema";

const languageOptions: SupportedLanguage[] = ["pt", "en", "es"];
const QUICK_RENEW_DAYS = 30;
const assignmentStatusValues: AssessmentAssignmentStatus[] = [
  "pending",
  "in_progress",
  "paused",
  "completed",
];

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

type AssessmentStatus = Assessment["status"];

type CreateAssessmentPayload = {
  name: string;
  description?: string;
  defaultLanguage: SupportedLanguage;
  testIds: string[];
  tags: string[];
  estimatedDurationMinutes?: number;
  status: AssessmentStatus;
};

type GenerateLinkPayload = {
  language: SupportedLanguage;
  expiresAt?: Date | null;
};

type AssignmentPayload = {
  assigneeName: string;
  assigneeId: string;
  language: SupportedLanguage;
  linkId: string;
};

type UpdateAssessmentPayload = {
  name: string;
  description?: string;
  defaultLanguage: SupportedLanguage;
  testIds: string[];
  tags: string[];
  estimatedDurationMinutes?: number;
};

export default function Avaliacoes() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const {
    assessments,
    tests,
    links,
    assignments,
    createAssessment,
    duplicateAssessment,
    updateAssessmentDetails,
    updateAssessmentStatus,
    generateLink,
    renewLink,
    markLinkExpired,
    regenerateLink,
    addAssignment,
    updateAssignmentDetails,
    removeLink,
    removeAssignment,
  } = useAssessmentsData();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState<AssessmentAssignmentStatus | "all">("all");

  const testsById = useMemo(() => new Map(tests.map((test) => [test.id, test])), [tests]);

  const sortedAssessments = useMemo(
    () => [...assessments].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
    [assessments],
  );

  useEffect(() => {
    if (!selectedId && sortedAssessments.length > 0) {
      setSelectedId(sortedAssessments[0].id);
    }
  }, [sortedAssessments, selectedId]);

  useEffect(() => {
    if (selectedId && !sortedAssessments.some((assessment) => assessment.id === selectedId)) {
      setSelectedId(sortedAssessments[0]?.id ?? null);
    }
  }, [sortedAssessments, selectedId]);

  useEffect(() => {
    setActiveTab("overview");
  }, [selectedId]);

  const filteredAssessments = useMemo(() => {
    const term = searchTerm.trim();
    if (!term) {
      return sortedAssessments;
    }

    const normalized = normalizeText(term);
    return sortedAssessments.filter((assessment) => {
      if (normalizeText(assessment.name).includes(normalized)) {
        return true;
      }
      if (assessment.description && normalizeText(assessment.description).includes(normalized)) {
        return true;
      }
      if (assessment.metadata?.tags?.some((tag) => normalizeText(String(tag)).includes(normalized))) {
        return true;
      }
      return assessment.tests.some((testRef) => {
        const related = testsById.get(testRef.testId);
        return related ? normalizeText(related.title).includes(normalized) : false;
      });
    });
  }, [sortedAssessments, searchTerm, testsById]);

  const selectedAssessment = useMemo(
    () => sortedAssessments.find((assessment) => assessment.id === selectedId) ?? null,
    [sortedAssessments, selectedId],
  );

  const selectedLinks = useMemo(() => {
    if (!selectedAssessment) {
      return [] as AssessmentLink[];
    }

    return links
      .filter((link) => link.assessmentId === selectedAssessment.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [links, selectedAssessment]);

  const selectedAssignments = useMemo(() => {
    if (!selectedAssessment) {
      return [] as AssessmentAssignment[];
    }
    return assignments
      .filter((assignment) => assignment.assessmentId === selectedAssessment.id)
      .sort((a, b) => (b.lastActivityAt?.getTime() ?? 0) - (a.lastActivityAt?.getTime() ?? 0));
  }, [assignments, selectedAssessment]);

  const assignmentStatusOptions = useMemo(
    () =>
      assignmentStatusValues.map((status) => ({
        value: status,
        label: t(`assessments.assignments.status.${status}`),
      })),
    [t],
  );

  const filteredAssignments = useMemo(() => {
    if (assignmentStatusFilter === "all") {
      return selectedAssignments;
    }
    return selectedAssignments.filter((assignment) => assignment.status === assignmentStatusFilter);
  }, [assignmentStatusFilter, selectedAssignments]);

  const formatRemainingTime = useCallback(
    (value?: number) => {
      if (typeof value !== "number") {
        return "-";
      }
      const minutes = Math.max(0, Math.ceil(value / (60 * 1000)));
      return t("assessments.assignments.remainingMinutes", { minutes });
    },
    [t],
  );

  const formatDate = useMemo(
    () => new Intl.DateTimeFormat(i18n.language ?? "pt", { dateStyle: "medium" }),
    [i18n.language],
  );

  const formatDateTime = useMemo(
    () => new Intl.DateTimeFormat(i18n.language ?? "pt", { dateStyle: "medium", timeStyle: "short" }),
    [i18n.language],
  );

  const getEstimatedDuration = useCallback(
    (assessment: Assessment) => {
      if (assessment.metadata?.estimatedDurationMinutes) {
        return assessment.metadata.estimatedDurationMinutes;
      }

      return assessment.tests.reduce((total, testRef) => {
        const related = testsById.get(testRef.testId);
        return total + (related?.estimatedDurationMinutes ?? 0);
      }, 0);
    },
    [testsById],
  );

  const handleCreateAssessment = useCallback(
    (payload: CreateAssessmentPayload) => {
      const assessment = createAssessment(payload);
      setSelectedId(assessment.id);
      toast({ description: t("assessments.toasts.created") });
    },
    [createAssessment, t, toast],
  );

  const handleDuplicateAssessment = useCallback(
    (assessmentId: string, suffix: string) => {
      const duplicate = duplicateAssessment(assessmentId, { suffix });
      if (duplicate) {
        setSelectedId(duplicate.id);
        toast({ description: t("assessments.toasts.duplicated") });
      }
    },
    [duplicateAssessment, t, toast],
  );

  const handleUpdateAssessment = useCallback(
    (assessmentId: string, payload: UpdateAssessmentPayload) => {
      const updated = updateAssessmentDetails(assessmentId, payload);
      if (updated) {
        setSelectedId(updated.id);
        toast({ description: t("assessments.toasts.updated") });
      }
    },
    [setSelectedId, t, toast, updateAssessmentDetails],
  );

  const handleCopyLink = useCallback(
    async (value: string) => {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(value);
          toast({ description: t("assessments.links.copied") });
        } catch (error) {
          console.warn("clipboard", error);
        }
      }
    },
    [t, toast],
  );

  const handleRenewLink = useCallback((linkId: string, days: number = QUICK_RENEW_DAYS) => {
    const updated = renewLink({ linkId, days });
    if (updated) {
      toast({ description: t("assessments.toasts.linkRenewed") });
    }
  }, [renewLink, t, toast]);

  const handleExpireLink = useCallback((linkId: string) => {
    const updated = markLinkExpired(linkId);
    if (updated) {
      toast({ description: t("assessments.toasts.linkExpired") });
    }
  }, [markLinkExpired, t, toast]);

  const handleRegenerateLink = useCallback((linkId: string) => {
    const updated = regenerateLink(linkId);
    if (updated) {
      toast({ description: t("assessments.toasts.linkRegenerated") });
    }
  }, [regenerateLink, t, toast]);

  const handleGenerateLink = useCallback(
    (assessmentId: string, payload: GenerateLinkPayload) => {
      generateLink({
        assessmentId,
        language: payload.language,
        expiresAt: payload.expiresAt ?? undefined,
      });
      toast({ description: t("assessments.toasts.linkCreated") });
    },
    [generateLink, t, toast],
  );

  const handleAddAssignment = useCallback(
    (assessmentId: string, payload: AssignmentPayload) => {
      addAssignment({
        assessmentId,
        assigneeId: payload.assigneeId,
        assigneeName: payload.assigneeName,
        language: payload.language,
        linkId: payload.linkId,
      });
      toast({ description: t("assessments.toasts.assignmentCreated") });
    },
    [addAssignment, t, toast],
  );

  const handleAssignmentStatusChange = useCallback(
    (assignmentId: string, status: AssessmentAssignmentStatus) => {
      updateAssignmentDetails({ assignmentId, status });
      toast({ description: t("assessments.toasts.assignmentUpdated") });
    },
    [t, toast, updateAssignmentDetails],
  );

  const handleAssignmentLanguageChange = useCallback(
    (assignmentId: string, language: SupportedLanguage) => {
      updateAssignmentDetails({ assignmentId, language });
      toast({ description: t("assessments.toasts.assignmentUpdated") });
    },
    [t, toast, updateAssignmentDetails],
  );

  const handleAssignmentProgressSave = useCallback(
    (assignmentId: string, percentage: number) => {
      if (!Number.isFinite(percentage)) {
        return;
      }
      updateAssignmentDetails({ assignmentId, progressPercentage: percentage });
      toast({ description: t("assessments.toasts.assignmentUpdated") });
    },
    [t, toast, updateAssignmentDetails],
  );

  const handleArchive = useCallback(
    (assessmentId: string) => {
      updateAssessmentStatus(assessmentId, "archived");
      toast({ description: t("assessments.toasts.archived") });
    },
    [t, toast, updateAssessmentStatus],
  );

  const handlePublish = useCallback(
    (assessmentId: string) => {
      updateAssessmentStatus(assessmentId, "published");
      toast({ description: t("assessments.toasts.published") });
    },
    [t, toast, updateAssessmentStatus],
  );

  const handleResume = useCallback(
    (assessmentId: string) => {
      updateAssessmentStatus(assessmentId, "draft");
      toast({ description: t("assessments.toasts.resumed") });
    },
    [t, toast, updateAssessmentStatus],
  );
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("assessments.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("assessments.subtitle")}</p>
        </div>
        <CreateAssessmentDialog tests={tests} onCreate={handleCreateAssessment} />
      </div>

      <div className="grid gap-6 md:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="md:h-[620px]">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">
              {t("navigation.assessments")}
            </CardTitle>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={t("assessments.searchPlaceholder") ?? ""}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t("assessments.counter", {
                  filtered: filteredAssessments.length,
                  total: assessments.length,
                })}
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[480px] pr-2">
              <div className="space-y-2">
                {filteredAssessments.map((assessment) => {
                  const duration = getEstimatedDuration(assessment);
                  const testsCount = assessment.tests.length;
                  const isActive = assessment.id === selectedAssessment?.id;
                  return (
                    <button
                      key={assessment.id}
                      type="button"
                      onClick={() => setSelectedId(assessment.id)}
                      className={cn(
                        "w-full rounded-lg border bg-card text-left transition-colors",
                        isActive ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 px-4 py-3">
                        <div>
                          <p className="font-medium leading-tight">{assessment.name}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <ListChecks className="h-3.5 w-3.5" />
                              {t("assessments.list.testsCount", {
                                count: testsCount,
                              })}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Languages className="h-3.5 w-3.5" />
                              {t(`tests.languages.${assessment.defaultLanguage}`, {
                                defaultValue: assessment.defaultLanguage.toUpperCase(),
                              })}
                            </span>
                            {duration > 0 ? (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {t("assessments.list.duration", { minutes: duration })}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="secondary">
                            {t(`assessments.status.${assessment.status}`)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {t("assessments.list.updatedAt", {
                              date: formatDate.format(assessment.updatedAt),
                            })}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {filteredAssessments.length === 0 ? (
                  <Card className="border-dashed text-center">
                    <CardContent className="py-10 text-sm text-muted-foreground">
                      {t("assessments.links.empty")}
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="flex min-h-[620px] flex-col">
          {selectedAssessment ? (
            <Card className="flex h-full flex-col">
              <CardHeader className="flex flex-col gap-3 border-b pb-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold leading-tight">
                      {selectedAssessment.name}
                    </CardTitle>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="font-medium">
                        {t(`assessments.status.${selectedAssessment.status}`)}
                      </Badge>
                      <span>
                        {t("assessments.list.updatedAt", {
                          date: formatDate.format(selectedAssessment.updatedAt),
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <EditAssessmentDialog
                      assessment={selectedAssessment}
                      tests={tests}
                      onSave={(payload) => handleUpdateAssessment(selectedAssessment.id, payload)}
                    />
                    <DuplicateAssessmentDialog
                      assessment={selectedAssessment}
                      onDuplicate={(suffix) => handleDuplicateAssessment(selectedAssessment.id, suffix)}
                    />
                    {selectedAssessment.status === "draft" ? (
                      <Button variant="secondary" onClick={() => handlePublish(selectedAssessment.id)}>
                        {t("assessments.publishButton")}
                      </Button>
                    ) : null}
                    {selectedAssessment.status !== "archived" ? (
                      <Button variant="outline" onClick={() => handleArchive(selectedAssessment.id)}>
                        <Archive className="mr-2 h-4 w-4" />
                        {t("assessments.archiveButton")}
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={() => handleResume(selectedAssessment.id)}>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        {t("assessments.resumeButton")}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
                  <TabsList className="grid w-full grid-cols-4 rounded-none border-b bg-card">
                    <TabsTrigger value="overview">{t("assessments.tabs.overview")}</TabsTrigger>
                    <TabsTrigger value="links">{t("assessments.tabs.links")}</TabsTrigger>
                    <TabsTrigger value="assignments">{t("assessments.tabs.assignments")}</TabsTrigger>
                    <TabsTrigger value="history">{t("assessments.tabs.history")}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview" className="flex-1 overflow-y-auto">
                    <div className="space-y-6 p-6">
                      <section className="space-y-2">
                        <h3 className="text-sm font-semibold text-muted-foreground">
                          {t("assessments.overview.description")}
                        </h3>
                        <p className="text-sm text-foreground">
                          {selectedAssessment.description || "-"}
                        </p>
                      </section>
                      <section className="space-y-2">
                        <h3 className="text-sm font-semibold text-muted-foreground">
                          {t("assessments.overview.tests")}
                        </h3>
                        <div className="space-y-2">
                          {selectedAssessment.tests.map((testRef) => {
                            const test = testsById.get(testRef.testId);
                            return (
                              <div
                                key={`${testRef.testId}-${testRef.testVersion}`}
                                className="flex items-center justify-between rounded-md border px-3 py-2"
                              >
                                <div>
                                  <p className="text-sm font-medium leading-tight">
                                    {test?.title ?? testRef.testId}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    v{testRef.testVersion}
                                  </p>
                                </div>
                                <Badge variant="outline">
                                  {t(`tests.languages.${test?.language ?? selectedAssessment.defaultLanguage}`, {
                                    defaultValue: (test?.language ?? selectedAssessment.defaultLanguage).toUpperCase(),
                                  })}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                      <section className="space-y-2">
                        <h3 className="text-sm font-semibold text-muted-foreground">
                          {t("assessments.overview.tags")}
                        </h3>
                        {selectedAssessment.metadata?.tags && selectedAssessment.metadata.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedAssessment.metadata.tags.map((tag) => (
                              <Badge key={tag} variant="outline">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {t("assessments.overview.emptyTags")}
                          </p>
                        )}
                      </section>
                      <section className="space-y-2">
                        <h3 className="text-sm font-semibold text-muted-foreground">
                          {t("assessments.overview.metadata")}
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-md border p-3">
                            <p className="text-xs text-muted-foreground">
                              {t("assessments.list.duration", { minutes: getEstimatedDuration(selectedAssessment) })}
                            </p>
                          </div>
                          <div className="rounded-md border p-3">
                            <p className="text-xs text-muted-foreground">
                              {t("assessments.list.defaultLanguage", {
                                language: t(`tests.languages.${selectedAssessment.defaultLanguage}`, {
                                  defaultValue: selectedAssessment.defaultLanguage.toUpperCase(),
                                }),
                              })}
                            </p>
                          </div>
                        </div>
                      </section>
                    </div>
                  </TabsContent>
                  <TabsContent value="links" className="flex-1 overflow-y-auto">
                    <div className="flex flex-col gap-4 p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold">{t("assessments.links.title")}</h3>
                        <GenerateLinkDialog
                          assessment={selectedAssessment}
                          onGenerate={(data) => handleGenerateLink(selectedAssessment.id, data)}
                        />
                      </div>
                      {selectedLinks.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t("assessments.links.empty")}</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{t("assessments.links.columns.code")}</TableHead>
                                <TableHead>{t("assessments.links.columns.language")}</TableHead>
                                <TableHead>{t("assessments.links.columns.url")}</TableHead>
                                <TableHead>{t("assessments.links.columns.createdAt")}</TableHead>
                                <TableHead>{t("assessments.links.columns.expiresAt")}</TableHead>
                                <TableHead>{t("assessments.links.columns.status")}</TableHead>
                                <TableHead className="w-28 text-right">
                                  {t("assessments.links.columns.actions")}
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedLinks.map((link) => {
                                const isExpired = Boolean(
                                  link.expiresAt && link.expiresAt.getTime() < Date.now(),
                                );
                                return (
                                  <TableRow key={link.id}>
                                    <TableCell className="font-medium">{link.code}</TableCell>
                                    <TableCell>
                                      {t(`tests.languages.${link.language}`, {
                                        defaultValue: link.language.toUpperCase(),
                                      })}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="truncate text-sm" title={link.url}>
                                          {link.url}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell>{formatDate.format(link.createdAt)}</TableCell>
                                    <TableCell>
                                      {link.expiresAt ? formatDate.format(link.expiresAt) : "-"}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={isExpired ? "destructive" : "outline"}>
                                        {isExpired
                                          ? t("assessments.links.statusBadge.expired")
                                          : t("assessments.links.statusBadge.active")}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleCopyLink(link.url)}
                                          aria-label={t("assessments.links.copy") ?? ""}
                                        >
                                          <Copy className="h-4 w-4" />
                                        </Button>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              aria-label={t("assessments.links.actionsMenu") ?? ""}
                                            >
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleRenewLink(link.id)}>{t("assessments.links.actions.renew", { days: QUICK_RENEW_DAYS })}</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleRegenerateLink(link.id)}>{t("assessments.links.actions.regenerate")}</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleExpireLink(link.id)}>{t("assessments.links.actions.expire")}</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => removeLink(link.id)}>{t("assessments.links.actions.remove")}</DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="assignments" className="flex-1 overflow-y-auto">
                    <div className="flex flex-col gap-4 p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold">{t("assessments.assignments.title")}</h3>
                        <AddAssignmentDialog
                          availableLinks={selectedLinks}
                          defaultLanguage={selectedAssessment.defaultLanguage}
                          onAdd={(payload) => handleAddAssignment(selectedAssessment.id, payload)}
                        />
                      </div>
                      {selectedAssignments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t("assessments.assignments.empty")}</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{t("assessments.assignments.columns.assignee")}</TableHead>
                                <TableHead>{t("assessments.assignments.columns.status")}</TableHead>
                                <TableHead>{t("assessments.assignments.columns.progress")}</TableHead>
                                <TableHead>{t("assessments.assignments.columns.language")}</TableHead>
                                <TableHead>{t("assessments.assignments.columns.lastActivity")}</TableHead>
                                <TableHead className="w-24 text-right">
                                  {t("assessments.assignments.columns.actions")}
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedAssignments.map((assignment) => (
                                <TableRow key={assignment.id}>
                                  <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span>{String(assignment.metadata?.assigneeName ?? assignment.assigneeId)}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {t(`assessments.assignments.status.${assignment.status}`)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Progress value={assignment.progress.percentage} className="h-2 w-24" />
                                      <span className="text-xs text-muted-foreground">
                                        {assignment.progress.percentage}%
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {t(`tests.languages.${assignment.language}`, {
                                      defaultValue: assignment.language.toUpperCase(),
                                    })}
                                  </TableCell>
                                  <TableCell>
                                    {assignment.lastActivityAt ? formatDateTime.format(assignment.lastActivityAt) : "-"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => removeAssignment(assignment.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="history" className="flex-1 overflow-y-auto">
                    <div className="space-y-4 p-6">
                      <h3 className="text-sm font-semibold">{t("assessments.history.title")}</h3>
                      {selectedAssessment.history.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t("assessments.history.empty")}</p>
                      ) : (
                        <div className="space-y-3">
                          {selectedAssessment.history.map((entry) => (
                            <div key={`${entry.version}-${entry.createdAt.toISOString()}`} className="rounded-md border p-3">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline">v{entry.version}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDateTime.format(entry.createdAt)}
                                </span>
                              </div>
                              {entry.note ? (
                                <p className="mt-2 text-sm text-foreground">{entry.note}</p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
              <CardContent>{t("assessments.links.empty")}</CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
interface CreateAssessmentDialogProps {
  tests: PsychologicalTest[];
  onCreate: (payload: CreateAssessmentPayload) => void;
}

function CreateAssessmentDialog({ tests, onCreate }: CreateAssessmentDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [defaultLanguage, setDefaultLanguage] = useState<SupportedLanguage>("pt");
  const [status, setStatus] = useState<AssessmentStatus>("draft");
  const [tags, setTags] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");

  const resetState = useCallback(() => {
    setName("");
    setDescription("");
    setSelectedTests(new Set());
    setDefaultLanguage("pt");
    setStatus("draft");
    setTags("");
    setEstimatedDuration("");
  }, []);

  const toggleTest = useCallback((testId: string) => {
    setSelectedTests((prev) => {
      const next = new Set(prev);
      if (next.has(testId)) {
        next.delete(testId);
      } else {
        next.add(testId);
      }
      return next;
    });
  }, []);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmedName = name.trim();
      if (!trimmedName) {
        toast({ variant: "destructive", description: t("validation.required") });
        return;
      }
      if (selectedTests.size === 0) {
        toast({ variant: "destructive", description: t("validation.required") });
        return;
      }

      const parsedDuration = Number(estimatedDuration);
      const duration = Number.isFinite(parsedDuration) && parsedDuration > 0 ? parsedDuration : undefined;

      onCreate({
        name: trimmedName,
        description: description.trim() || undefined,
        defaultLanguage,
        testIds: Array.from(selectedTests),
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        estimatedDurationMinutes: duration,
        status,
      });

      setOpen(false);
      resetState();
    },
    [defaultLanguage, description, estimatedDuration, name, onCreate, resetState, selectedTests, status, tags, t, toast],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) {
          resetState();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t("assessments.createButton")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("assessments.modals.create.title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assessment-name">{t("assessments.modals.create.nameLabel")}</Label>
            <Input
              id="assessment-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("assessments.modals.create.namePlaceholder") ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assessment-description">{t("assessments.modals.create.descriptionLabel")}</Label>
            <Textarea
              id="assessment-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t("assessments.modals.create.descriptionPlaceholder") ?? ""}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("assessments.modals.create.testsLabel")}</Label>
            <div className="grid max-h-48 gap-2 overflow-y-auto rounded-md border p-3">
              {tests.map((test) => {
                const checked = selectedTests.has(test.id);
                return (
                  <label key={test.id} className="flex cursor-pointer items-start gap-3 text-sm">
                    <Checkbox checked={checked} onCheckedChange={() => toggleTest(test.id)} />
                    <div className="space-y-1">
                      <span className="font-medium leading-tight">{test.title}</span>
                      <span className="block text-xs text-muted-foreground line-clamp-2">{test.description}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("assessments.modals.create.defaultLanguageLabel")}</Label>
              <Select value={defaultLanguage} onValueChange={(value: SupportedLanguage) => setDefaultLanguage(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {t(`tests.languages.${lang}`, { defaultValue: lang.toUpperCase() })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("assessments.modals.create.statusLabel")}</Label>
              <Select value={status} onValueChange={(value: AssessmentStatus) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{t("assessments.status.draft")}</SelectItem>
                  <SelectItem value="published">{t("assessments.status.published")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="assessment-tags">{t("assessments.modals.create.tagsLabel")}</Label>
              <Input
                id="assessment-tags"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder={t("assessments.modals.create.tagsPlaceholder") ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assessment-duration">{t("assessments.modals.create.estimatedDurationLabel")}</Label>
              <Input
                id="assessment-duration"
                type="number"
                min={0}
                value={estimatedDuration}
                onChange={(event) => setEstimatedDuration(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("assessments.modals.create.cancel")}
            </Button>
            <Button type="submit">{t("assessments.modals.create.submit")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
interface DuplicateAssessmentDialogProps {
  assessment: Assessment;
  onDuplicate: (suffix: string) => void;
}

function DuplicateAssessmentDialog({ assessment, onDuplicate }: DuplicateAssessmentDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [suffix, setSuffix] = useState("copia");

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = suffix.trim();
      if (!trimmed) {
        return;
      }
      onDuplicate(trimmed);
      setOpen(false);
    },
    [onDuplicate, suffix],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{t("assessments.duplicateButton")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("assessments.modals.duplicate.title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="duplicate-suffix">{t("assessments.modals.duplicate.title")}</Label>
            <Input
              id="duplicate-suffix"
              value={suffix}
              onChange={(event) => setSuffix(event.target.value)}
              placeholder={`${assessment.name} (${suffix})`}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("assessments.modals.create.cancel")}
            </Button>
            <Button type="submit">{t("assessments.modals.duplicate.submit")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
interface EditAssessmentDialogProps {
  assessment: Assessment;
  tests: PsychologicalTest[];
  onSave: (payload: UpdateAssessmentPayload) => void;
}

function EditAssessmentDialog({ assessment, tests, onSave }: EditAssessmentDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(assessment.name);
  const [description, setDescription] = useState(assessment.description ?? "");
  const [defaultLanguage, setDefaultLanguage] = useState<SupportedLanguage>(assessment.defaultLanguage);
  const [tags, setTags] = useState((assessment.metadata?.tags ?? []).join(", "));
  const [estimatedDuration, setEstimatedDuration] = useState(() =>
    assessment.metadata?.estimatedDurationMinutes
      ? String(assessment.metadata.estimatedDurationMinutes)
      : "",
  );
  const initialSelected = useMemo(
    () => assessment.tests.slice().sort((a, b) => a.order - b.order).map((item) => item.testId),
    [assessment.tests],
  );
  const [selectedTests, setSelectedTests] = useState<string[]>(initialSelected);

  useEffect(() => {
    if (!open) {
      return;
    }
    setName(assessment.name);
    setDescription(assessment.description ?? "");
    setDefaultLanguage(assessment.defaultLanguage);
    setTags((assessment.metadata?.tags ?? []).join(", "));
    setEstimatedDuration(
      assessment.metadata?.estimatedDurationMinutes
        ? String(assessment.metadata.estimatedDurationMinutes)
        : "",
    );
    setSelectedTests(initialSelected);
  }, [assessment, initialSelected, open]);

  const availableTests = useMemo(
    () => tests.filter((test) => !selectedTests.includes(test.id)),
    [selectedTests, tests],
  );

  const moveTest = (testId: string, direction: -1 | 1) => {
    setSelectedTests((prev) => {
      const index = prev.indexOf(testId);
      if (index === -1) {
        return prev;
      }
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) {
        return prev;
      }
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(nextIndex, 0, item);
      return copy;
    });
  };

  const removeTest = (testId: string) => {
    setSelectedTests((prev) => prev.filter((id) => id !== testId));
  };

  const addTest = (testId: string) => {
    setSelectedTests((prev) => (prev.includes(testId) ? prev : [...prev, testId]));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast({ variant: "destructive", description: t("validation.required") });
      return;
    }
    if (selectedTests.length === 0) {
      toast({ variant: "destructive", description: t("assessments.validation.testsRequired") });
      return;
    }
    const parsedDuration = Number(estimatedDuration);
    const duration = Number.isFinite(parsedDuration) && parsedDuration > 0 ? parsedDuration : undefined;
    onSave({
      name: trimmedName,
      description: description.trim() || undefined,
      defaultLanguage,
      testIds: selectedTests,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      estimatedDurationMinutes: duration,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Pencil className="mr-2 h-4 w-4" />
          {t("assessments.configureButton")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("assessments.modals.edit.title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="edit-assessment-name">{t("assessments.modals.edit.nameLabel")}</Label>
            <Input
              id="edit-assessment-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-assessment-description">{t("assessments.modals.edit.descriptionLabel")}</Label>
            <Textarea
              id="edit-assessment-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("assessments.modals.edit.languageLabel")}</Label>
              <Select value={defaultLanguage} onValueChange={(value: SupportedLanguage) => setDefaultLanguage(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {t(`tests.languages.${lang}`, { defaultValue: lang.toUpperCase() })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-assessment-duration">
                {t("assessments.modals.edit.estimatedDurationLabel")}
              </Label>
              <Input
                id="edit-assessment-duration"
                type="number"
                min={0}
                value={estimatedDuration}
                onChange={(event) => setEstimatedDuration(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-3">
            <Label htmlFor="edit-assessment-tags">{t("assessments.modals.edit.tagsLabel")}</Label>
            <Input
              id="edit-assessment-tags"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder={t("assessments.modals.create.tagsPlaceholder") ?? ""}
            />
            <p className="text-xs text-muted-foreground">{t("assessments.modals.edit.tagsHint")}</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <Label>{t("assessments.modals.edit.selectedTests")}</Label>
              {selectedTests.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("assessments.modals.edit.noTestsSelected")}</p>
              ) : (
                <div className="space-y-2">
                  {selectedTests.map((testId, index) => {
                    const test = tests.find((item) => item.id === testId);
                    if (!test) {
                      return null;
                    }
                    return (
                      <div
                        key={test.id}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <div className="flex items-start gap-3">
                          <GripVertical className="mt-1 h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium leading-tight">{test.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {t("assessments.modals.edit.orderLabel", { index: index + 1 })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => moveTest(test.id, -1)}
                            disabled={index === 0}
                            aria-label={t("assessments.modals.edit.moveUp") ?? ""}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => moveTest(test.id, 1)}
                            disabled={index === selectedTests.length - 1}
                            aria-label={t("assessments.modals.edit.moveDown") ?? ""}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTest(test.id)}
                            aria-label={t("assessments.modals.edit.remove") ?? ""}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="space-y-3">
              <Label>{t("assessments.modals.edit.availableTests")}</Label>
              {availableTests.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("assessments.modals.edit.noAvailableTests")}</p>
              ) : (
                <div className="space-y-2">
                  {availableTests.map((test) => (
                    <div key={test.id} className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <p className="text-sm font-medium leading-tight">{test.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{test.description}</p>
                      </div>
                      <Button type="button" size="sm" variant="outline" onClick={() => addTest(test.id)}>
                        {t("assessments.modals.edit.addTest")}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("assessments.modals.create.cancel")}
            </Button>
            <Button type="submit">{t("assessments.modals.edit.submit")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


interface GenerateLinkDialogProps {
  assessment: Assessment;
  onGenerate: (payload: GenerateLinkPayload) => void;
}

function GenerateLinkDialog({ assessment, onGenerate }: GenerateLinkDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<SupportedLanguage>(assessment.defaultLanguage);
  const [expiresAt, setExpiresAt] = useState<string>("");

  useEffect(() => {
    if (open) {
      setLanguage(assessment.defaultLanguage);
      setExpiresAt("");
    }
  }, [assessment.defaultLanguage, open]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      onGenerate({
        language,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      });
      setOpen(false);
    },
    [expiresAt, language, onGenerate],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          {t("assessments.links.create")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("assessments.modals.link.title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("assessments.modals.link.languageLabel")}</Label>
            <Select value={language} onValueChange={(value: SupportedLanguage) => setLanguage(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {t(`tests.languages.${lang}`, { defaultValue: lang.toUpperCase() })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="link-expires">{t("assessments.modals.link.expiresAtLabel")}</Label>
            <Input
              id="link-expires"
              type="date"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("assessments.modals.create.cancel")}
            </Button>
            <Button type="submit">{t("assessments.modals.link.submit")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
interface AddAssignmentDialogProps {
  availableLinks: AssessmentLink[];
  defaultLanguage: SupportedLanguage;
  onAdd: (payload: AssignmentPayload) => void;
}

function AddAssignmentDialog({ availableLinks, defaultLanguage, onAdd }: AddAssignmentDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [language, setLanguage] = useState<SupportedLanguage>(defaultLanguage);
  const [linkId, setLinkId] = useState<string>(availableLinks[0]?.id ?? "");

  useEffect(() => {
    if (open) {
      setLanguage(defaultLanguage);
      setLinkId(availableLinks[0]?.id ?? "");
    }
  }, [availableLinks, defaultLanguage, open]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = name.trim();
      if (!trimmed || !linkId) {
        return;
      }
      onAdd({
        assigneeName: trimmed,
        assigneeId: slugify(trimmed) || `colab-${Date.now().toString(36)}`,
        language,
        linkId,
      });
      setName("");
      setOpen(false);
    },
    [language, linkId, name, onAdd],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={availableLinks.length === 0}>
          <Plus className="mr-2 h-4 w-4" />
          {t("assessments.assignments.add")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("assessments.modals.assignment.title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assignment-name">{t("assessments.modals.assignment.collaboratorLabel")}</Label>
            <Input
              id="assignment-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("assessments.modals.assignment.collaboratorPlaceholder") ?? ""}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("assessments.modals.assignment.languageLabel")}</Label>
              <Select value={language} onValueChange={(value: SupportedLanguage) => setLanguage(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {t(`tests.languages.${lang}`, { defaultValue: lang.toUpperCase() })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("assessments.modals.assignment.linkLabel")}</Label>
              <Select value={linkId} onValueChange={setLinkId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableLinks.map((link) => (
                    <SelectItem key={link.id} value={link.id}>
                      {link.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("assessments.modals.create.cancel")}
            </Button>
            <Button type="submit" disabled={availableLinks.length === 0}>
              {t("assessments.modals.assignment.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}