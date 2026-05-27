"use client";

import { useState } from "react";
import { parseAsString, useQueryState } from "nuqs";
import { Banknote, CalendarDays, Users, ShieldAlert } from "lucide-react";

import { MonthFilter } from "@/components/query-filters";
import { CreateSalaryForm, SalaryRowActions } from "@/components/salary-row-actions";
import { DatabaseBanner, EmptyState, MetricCard, SectionHeader } from "@/components/ui";
import { formatMonthInput, formatDateInput, getCurrentMonth, getMonthLabel } from "@/lib/dates";
import { useFinanceDataQuery } from "@/lib/finance-query";
import type { FinanceData } from "@/lib/finance-types";
import { formatCurrency } from "@/lib/money";
import { getAccountTypeLabel, getSalaryStatusLabel } from "@/lib/options";
import type { CurrentFamily } from "@/lib/auth-session";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Mail, Check, X, Send, Clock, UserPlus, Trash2 } from "lucide-react";
import { inviteMember, cancelInvitation, acceptInvitation, rejectInvitation } from "@/app/actions";
import { AppButton } from "@/components/app-button";
import { FormInput } from "@/components/form-fields";
import { inviteMemberFormSchema, type InviteMemberFormValues } from "@/lib/validations";

type MemberItem = {
  id: string;
  role: string;
  createdAt: Date;
  name: string | null;
  email: string | null;
};

export function FamilyPageClient({
  initialData,
  initialMonth,
  family,
  members,
  sentInvitations,
  receivedInvitations,
}: {
  initialData: FinanceData;
  initialMonth: string;
  family: CurrentFamily;
  members: MemberItem[];
  sentInvitations: {
    id: string;
    email: string;
    role: string | null;
    status: string;
    expiresAt: Date;
    createdAt: Date;
  }[];
  receivedInvitations: {
    id: string;
    email: string;
    role: string | null;
    status: string;
    expiresAt: Date;
    createdAt: Date;
    inviterName: string | null;
  }[];
}) {
  // Query-string state for active tab (deep-linkable, modern, avoids local useState)
  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("membros"));
  
  // Query-string state for current month
  const [month] = useQueryState("month", parseAsString.withDefault(initialMonth));
  const selectedMonth = month || getCurrentMonth();

  // Mutation to invite a member
  const inviteMutation = useMutation({
    mutationFn: async (email: string) => {
      const formData = new FormData();
      formData.append("email", email);
      return await inviteMember(formData);
    },
    onSuccess: () => {
      inviteForm.reset();
      window.location.reload();
    },
  });

  // Mutation to cancel a sent invitation
  const cancelMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const formData = new FormData();
      formData.append("invitationId", invitationId);
      return await cancelInvitation(formData);
    },
    onSuccess: () => {
      window.location.reload();
    },
  });

  // Mutation to accept an invitation
  const acceptMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const formData = new FormData();
      formData.append("invitationId", invitationId);
      return await acceptInvitation(formData);
    },
    onSuccess: () => {
      window.location.reload();
    },
  });

  // Mutation to reject an invitation
  const rejectMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const formData = new FormData();
      formData.append("invitationId", invitationId);
      return await rejectInvitation(formData);
    },
    onSuccess: () => {
      window.location.reload();
    },
  });

  // React Hook Form for sending invitation
  const inviteForm = useForm<InviteMemberFormValues>({
    resolver: zodResolver(inviteMemberFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleInviteSubmit = (values: InviteMemberFormValues) => {
    inviteMutation.mutate(values.email);
  };

  const handleCancelInvite = (id: string) => {
    if (confirm("Deseja realmente cancelar este convite?")) {
      cancelMutation.mutate(id);
    }
  };

  const handleAcceptInvite = (id: string) => {
    if (confirm("Ao aceitar o convite, você mudará para a família deste líder. Deseja prosseguir?")) {
      acceptMutation.mutate(id);
    }
  };

  const handleRejectInvite = (id: string) => {
    if (confirm("Deseja realmente recusar este convite?")) {
      rejectMutation.mutate(id);
    }
  };

  const isMutating = inviteMutation.isPending || cancelMutation.isPending || acceptMutation.isPending || rejectMutation.isPending;

  // Fetch real-time finance data for salaries query
  const query = useFinanceDataQuery({
    input: { month: selectedMonth, year: Number(selectedMonth.slice(0, 4)) },
    initialInput: { month: initialMonth, year: Number(initialMonth.slice(0, 4)) },
    initialData,
  });

  const data = query.data ?? initialData;
  const accounts = data.accounts.map((account) => ({ id: account.id, name: account.name, type: account.type }));
  const incomeCategories = data.categories
    .filter((category) => category.type === "income")
    .map((category) => ({ id: category.id, name: category.name, type: category.type }));
  const disabled = data.mode !== "database" || accounts.length === 0 || incomeCategories.length === 0;

  return (
    <div className="space-y-6">
      <DatabaseBanner message={data.databaseMessage} mode={data.mode} />

      {/* Top Header Card */}
      <section className="glass-panel rounded-[2rem] p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary/80">Central Familiar</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight">{family.organizationName}</h1>
            <p className="mt-2 text-sm text-[#96a59b]">Gerencie os membros da sua família e configure a renda recorrente mensal da casa.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary font-medium">
              {family.hasPremiumAccess ? "Acesso Premium Ativo" : "Trial ou Assinatura Inativa"}
            </div>
          </div>
        </div>
      </section>

      {/* Modern Premium Tabs Selector */}
      <div className="flex gap-2 border-b border-white/10 pb-px">
        <button
          onClick={() => setTab("membros")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold tracking-wide rounded-t-2xl border-t border-x transition-all duration-200 cursor-pointer ${
            tab === "membros"
              ? "bg-primary/10 border-white/10 text-primary shadow-[0_-4px_12px_rgba(16,185,129,0.06)]"
              : "bg-transparent border-transparent text-[#96a59b] hover:text-white"
          }`}
        >
          <Users className="size-4" />
          Membros da Família
        </button>
        <button
          onClick={() => setTab("renda")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold tracking-wide rounded-t-2xl border-t border-x transition-all duration-200 cursor-pointer ${
            tab === "renda"
              ? "bg-primary/10 border-white/10 text-primary shadow-[0_-4px_12px_rgba(16,185,129,0.06)]"
              : "bg-transparent border-transparent text-[#96a59b] hover:text-white"
          }`}
        >
          <Banknote className="size-4" />
          Renda Familiar (Salários)
        </button>
      </div>

      {/* Tab Contents: Members */}
      {tab === "membros" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <section className="grid gap-4 md:grid-cols-3">
            <FamilyMetric label="Status da Conta" value={family.subscriptionStatus === "trialing" ? "Período de Testes" : family.subscriptionStatus} />
            <FamilyMetric label="Trial expira em" value={formatDateInput(family.trialEndsAt.toISOString().slice(0, 10))} />
            <FamilyMetric label="Membros cadastrados" value={`${members.length}/3`} />
          </section>

          <section className="glass-panel rounded-[2rem] p-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <Users className="size-5 text-primary" />
              Membros da Casa
            </h2>
            <p className="mt-1 text-sm text-[#96a59b] mb-4">Pessoas associadas à organização familiar com acesso compartilhado ao app.</p>
            <div className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10">
              {members.map((item) => (
                <div key={item.id} className="flex flex-col gap-2 bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-[#eefbf1]">{item.name || "Sem nome cadastrado"}</p>
                    <p className="text-sm text-[#96a59b]">{item.email}</p>
                  </div>
                  <span className="inline-flex max-w-max items-center rounded-lg bg-primary/10 px-2.5 py-0.5 text-sm font-semibold uppercase tracking-[0.15em] text-primary">
                    {item.role === "owner" ? "Líder" : "Membro"}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {receivedInvitations.length > 0 && (
            <section className="glass-panel rounded-[2rem] p-6 border border-primary/30 bg-primary/5 shadow-[0_0_20px_rgba(16,185,129,0.1)] animate-in fade-in-50 slide-in-from-bottom-5 duration-300">
              <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                <Mail className="size-5 text-primary animate-pulse" />
                Convites Pendentes para Você!
              </h2>
              <p className="mt-1 text-sm text-[#96a59b] mb-4">Você foi convidado para fazer parte das seguintes famílias. Ao aceitar, sua família ativa mudará.</p>
              <div className="space-y-3">
                {receivedInvitations.map((invite) => (
                  <div key={invite.id} className="flex flex-col gap-4 bg-white/[0.03] px-5 py-4 rounded-2xl border border-white/10 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-white">
                        Convidado por <span className="text-primary">{invite.inviterName || "Líder"}</span>
                      </p>
                      <p className="text-sm text-[#96a59b]">E-mail de destino: {invite.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <AppButton
                        onClick={() => handleAcceptInvite(invite.id)}
                        disabled={isMutating}
                        className="bg-primary hover:opacity-90 text-primary-foreground font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="size-4" />
                        Aceitar
                      </AppButton>
                      <AppButton
                        onClick={() => handleRejectInvite(invite.id)}
                        disabled={isMutating}
                        className="hover:bg-red-500/20 hover:text-red-400 border border-white/10 flex items-center gap-1.5 cursor-pointer"
                      >
                        <X className="size-4" />
                        Recusar
                      </AppButton>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {family.isOwner && (
            <section className="glass-panel rounded-[2rem] p-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                  <UserPlus className="size-5 text-primary" />
                  Convidar Novo Membro
                </h2>
                <p className="mt-1 text-sm text-[#96a59b]">Membros convidados terão acesso compartilhado para lançar transações e salários no orçamento da casa.</p>
              </div>

              {members.length + sentInvitations.length >= 3 ? (
                <div className="flex items-start gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-amber-300 text-sm">
                  <ShieldAlert className="size-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Limite de convites/membros atingido</p>
                    <p className="mt-0.5">Você pode ter no máximo 3 membros ativos e pendentes na sua família. Remova um membro existente ou cancele um convite abaixo para poder enviar outro.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={inviteForm.handleSubmit((values) => handleInviteSubmit(values))} className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <FormInput
                      form={inviteForm}
                      name="email"
                      label="E-mail do Convidado"
                      placeholder="exemplo@email.com"
                      disabled={isMutating}
                    />
                  </div>
                  <AppButton
                    type="submit"
                    disabled={isMutating}
                    className="bg-primary hover:opacity-90 text-primary-foreground font-bold h-[48px] px-6 flex items-center gap-2 cursor-pointer"
                  >
                    <Send className="size-4" />
                    Enviar Convite
                  </AppButton>
                </form>
              )}

              {/* Sent Pending Invitations list */}
              {sentInvitations.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#96a59b]">Convites Enviados Pendentes</h3>
                  <div className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10">
                    {sentInvitations.map((invite) => (
                      <div key={invite.id} className="flex flex-col gap-2 bg-white/[0.02] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-white">{invite.email}</p>
                          <p className="text-sm text-[#96a59b] flex items-center gap-1">
                            <Clock className="size-3" />
                            Enviado. Expira em {formatDateInput(invite.expiresAt.toISOString().slice(0, 10))}
                          </p>
                        </div>
                        <AppButton
                          onClick={() => handleCancelInvite(invite.id)}
                          disabled={isMutating}
                          className="hover:bg-red-500/20 hover:text-red-400 border border-white/10 max-w-max self-end sm:self-auto flex items-center gap-1.5 text-sm py-1 px-3 cursor-pointer"
                        >
                          <Trash2 className="size-3.5" />
                          Cancelar
                        </AppButton>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* Tab Contents: Income / Salaries */}
      {tab === "renda" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Section Header for Salaries */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Receitas e Salários Mensais</h2>
              <p className="text-sm text-[#96a59b]">Gerencie as entradas fixas e recorrentes que sustentam o orçamento familiar.</p>
            </div>
            <MonthFilter month={selectedMonth} />
          </div>

          <section className="grid gap-4 md:grid-cols-3">
            <MetricCard title="Salários ativos no mês" value={data.metrics.monthlySalaryIncome} caption={getMonthLabel(selectedMonth)} />
            <MetricCard title="Contas e saídas" value={data.metrics.monthlyExpense} tone="red" caption="Total de gastos previstos" />
            <MetricCard
              title="Resultado estimado"
              value={data.metrics.monthlySalaryIncome - data.metrics.monthlyExpense}
              tone={data.metrics.monthlySalaryIncome - data.metrics.monthlyExpense >= 0 ? "green" : "red"}
              caption="Salários menos saídas do mês"
            />
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            <section className="glass-panel rounded-[1.7rem] p-5 lg:col-span-2">
              <h3 className="mb-4 text-lg font-bold text-white">Salários Cadastrados</h3>
              {data.salaries.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] border-separate border-spacing-y-2 text-left text-sm">
                    <thead className="text-sm uppercase tracking-[0.2em] text-[#96a59b]">
                      <tr>
                        <th className="px-4 py-2">Nome</th>
                        <th className="px-4 py-2">Período</th>
                        <th className="px-4 py-2">Recebimento</th>
                        <th className="px-4 py-2 text-right">Valor</th>
                        <th className="px-4 py-2 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.salaries.map((salary) => (
                        <tr key={salary.id} className="bg-white/[0.035] text-[#e9f6ec]">
                          <td className="rounded-l-2xl px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                                <Banknote className="size-5" />
                              </span>
                              <div>
                                <div className="font-medium text-white">{salary.name}</div>
                                <div className="text-sm text-[#96a59b]">Dia de pagamento: {salary.paymentDay}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="inline-flex items-center gap-2 text-[#c8d5cc] text-sm">
                              <CalendarDays className="size-4 text-primary" />
                              {formatMonthInput(salary.startMonth)} até {salary.endMonth ? formatMonthInput(salary.endMonth) : "indefinido"}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-white">{salary.accountName}</div>
                            <div className="text-sm text-[#96a59b] uppercase tracking-[0.1em]">{getAccountTypeLabel(salary.accountType)}</div>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-primary">{formatCurrency(salary.amountCents)}</td>
                          <td className="rounded-r-2xl px-4 py-3">
                            <div className="flex justify-end">
                              <SalaryRowActions
                                accounts={accounts}
                                categories={incomeCategories}
                                disabled={disabled}
                                members={members}
                                salary={{
                                  id: salary.id,
                                  name: salary.name,
                                  amountCents: salary.amountCents,
                                  paymentDay: salary.paymentDay,
                                  startMonth: salary.startMonth,
                                  endMonth: salary.endMonth,
                                  accountId: salary.accountId,
                                  categoryId: salary.categoryId,
                                  status: salary.status,
                                  notes: salary.notes,
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="Nenhum salário cadastrado" description="Cadastre os salários fixos da casa para calcular o saldo final estimado do mês automaticamente." />
              )}
            </section>

            {/* Right Box: New Salary Form */}
            <section className="glass-panel rounded-[1.7rem] p-5 h-fit lg:col-span-1">
              <h3 className="text-lg font-bold text-white">Cadastrar Novo Salário</h3>
              <p className="mt-1 text-sm text-[#96a59b] mb-4">
                O valor entra automaticamente em todos os meses correspondentes no fluxo financeiro familiar.
              </p>
              {data.mode === "database" && (accounts.length === 0 || incomeCategories.length === 0) ? (
                <div className="mt-2 mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200 flex items-start gap-2">
                  <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                  <span>Cadastre uma conta bancária e uma categoria de entrada antes de adicionar salários.</span>
                </div>
              ) : null}
              <CreateSalaryForm accounts={accounts} categories={incomeCategories} disabled={disabled} selectedMonth={selectedMonth} members={members} />
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

function FamilyMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-panel rounded-[1.7rem] p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#96a59b]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#eefbf1]">{value}</p>
    </div>
  );
}
