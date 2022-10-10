import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eventful } from "types";
import { api } from "./api";
import { useEvents } from "./event";
import { request, scheduleNotifications } from "./notification";
import { useSession } from "./session";
import moment from "moment-timezone";
import { formatStart } from "./time";
import { useEffect } from "react";
import { createUrl } from "../libs/linking";
import { getTitle } from "./plan";

export const UNIT_LABEL = {
  m: "minute",
  h: "hour",
  d: "day",
  w: "week",
  M: "month",
};

export const useReminders = () => {
  const { session } = useSession();
  const query = useQuery(
    ["reminders"],
    () =>
      api
        .get<Eventful.Reminder[]>(`user/${session?._id}/reminders`)
        .then((res) => res.data),
    { enabled: !!session }
  );
  const qc = useQueryClient();

  useEffect(() => {
    if (!!query.data?.length) {
      request();
    }
  }, [query]);

  const addReminder = useMutation(
    () => request().finally(() => api.post(`user/${session?._id}/reminders`)),
    {
      onSuccess: () => {
        qc.invalidateQueries(["reminders"]);
      },
    }
  );
  const setReminder = useMutation(
    (reminder: Eventful.API.ReminderEdit) =>
      request().finally(() =>
        api.put(`user/${session?._id}/reminders/${reminder._id}`, reminder)
      ),
    {
      onSuccess: () => {
        qc.invalidateQueries(["reminders"]);
      },
    }
  );
  const deleteReminder = useMutation(
    (id: Eventful.ID) => api.delete(`user/${session?._id}/reminders/${id}`),
    {
      onSuccess: () => {
        qc.invalidateQueries(["reminders"]);
      },
    }
  );

  return {
    ...query,
    addReminder: addReminder.mutateAsync,
    setReminder: setReminder.mutateAsync,
    deleteReminder: deleteReminder.mutateAsync,
  };
};

export const _scheduleNotifications = async (
  events: Eventful.API.EventGet[],
  reminders: Eventful.Reminder[]
) => {
  if (events) {
    const now = moment();
    const added: string[] = [];
    return await scheduleNotifications(
      events
        .filter(
          (event) =>
            event.time.start && moment(event.time.start.date).isSameOrAfter(now)
        )
        .reduce(
          (notifs, event) =>
            notifs.concat(
              reminders?.reduce((rems, reminder) => {
                event.plans.forEach((plan) => {
                  if (!plan.time?.start) {
                    return;
                  }
                  // add the notification if it's not already added
                  const seconds = moment(plan.time.start.date)
                    .subtract(reminder.amount, reminder.unit)
                    .diff(new Date(), "s");
                  const addedId = `${event._id.toString()}:${seconds}`;
                  const general: Eventful.NotificationPayload["general"] = {
                    id: addedId,
                    title: getTitle(plan),
                    subtitle: event.name.trim(),
                    url: createUrl({ eventId: event._id.toString() }),
                  };
                  const newRem: Eventful.LocalNotification = {
                    expo: {
                      identifier: addedId,
                      content: {
                        title: getTitle(plan),
                        body: `${formatStart(plan.time)} (${moment
                          .duration(reminder.amount, reminder.unit)
                          .humanize(true)})`,
                        subtitle: event.name.trim(),
                        data: {
                          url: createUrl({ eventId: event._id.toString() }),
                        },
                      },
                      trigger: {
                        seconds,
                      },
                    },
                    general,
                  };
                  if (!added.includes(addedId) && seconds > 0) {
                    rems.push(newRem);
                    added.push(addedId);
                  }
                  return rems;
                });
                return rems;
              }, [] as Eventful.LocalNotification[]) ?? []
            ),
          [] as Eventful.LocalNotification[]
        )
    );
  }
};

export const useReminderScheduler = () => {
  const { data: reminders, isFetching: isFetchingReminders } = useReminders();
  const { data: events, isFetching: isFetchingEvents } = useEvents();

  useEffect(() => {
    if (reminders && events) {
      _scheduleNotifications(events, reminders);
    }
  }, [reminders, events, isFetchingEvents, isFetchingReminders]);
};
