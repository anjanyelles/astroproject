export const DriverScheduleTable: FC<DriverSchedulingTableProps> = (props) => {
  const driverEnhancementFlag =
    useFlagMe126412ViewDriverScheduleUxEnhancements();
  let isModalClosed = false;
  const [isNewForm, setIsNewForm] = useState(true);
  const [maxTimeRange, setMaxTimeRange] = useState(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const defaultData = useMemo(() => {
    return setDefaultInitialValForNew();
  }, []);
  const [tableData, setTableData] = useState<DriverSchedulesInfoFragment[]>();
  const [scheduleIndex, setScheduleIndex] = useState(0);
  const PAGE_SIZE = 100;
  const [runQuery, { loading, data: scheduleData, fetchMore, refetch }] =
    useGetSchedulesByDriverIdLazyQuery({
      fetchPolicy: 'cache-and-network',
      nextFetchPolicy: 'cache-first',
      notifyOnNetworkStatusChange: true,
      onCompleted: () => {
        const nodes = getNodesFromConnection<DriverSchedulesInfoFragment>(
          scheduleData?.getSchedulesByDriverId
        );
        refactorTableData(nodes);
      },
    });
  const refactorTableData = (nodes: DriverSchedulesInfoFragment[]): void => {
    const newNodes = nodes.map((node) => {
      let hours = node?.hours;
      if (hours) {
        hours = { ...hours, dayOfWeek: hours.dayOfWeek.toLowerCase() };
        node = { ...node, hours };
      }
      return node;
    });
    // sort the data by start and end time
    newNodes.sort((a, b) => {
      if (!a.hours || !b.hours) {
        if (!a.hours && !b.hours) {
          return 0;
        }
        return !a.hours ? 1 : -1;
      }

      if (a.hours.startTime !== b.hours.startTime) {
        return a.hours.startTime - b.hours.startTime;
      } else {
        return a.hours.endTime - b.hours.endTime;
      }
    });
    setTableData(newNodes);
  };
  const refreshTable = useCallback(() => {
    runQuery({
      variables: {
        filters: { driverId: props.driverId as string },
        first: PAGE_SIZE,
      },
    });
  }, [props.driverId, runQuery]);

  useEffect(() => {
    refreshTable();
  }, [refreshTable]);

  const handleScrollToBottom = async (): Promise<void> => {
    return await scrollToBottom(
      fetchMore,
      'getSchedulesByDriverId',
      scheduleData?.getSchedulesByDriverId?.pageInfo
    );
  };

  const tableDataMain = useTableData(
    () =>
      props.driverId
        ? setDriverScheduleTable(tableData)
        : (tableData as unknown as DriverScheduleFormData[]),
    undefined
  );

  const [assetDriverSchedule, { loading: isUpdatingDriverSchedule }] =
    useCreateOrUpdateDriverScheduleMutation();
  const [deleteDriverSchedule, { loading: isDeletingDriverSchedule }] =
    useDeleteDriverScheduleMutation();

  const columns = useDEPRECATEDTableColumns<DriverScheduleFormData>(
    () => [
      {
        Header: 'Eff. Date',
        id: 'effectiveDate',
        width: 65,
        short: true,
        accessor: (obj): maybeScalar => {
          if (obj?.effectiveDate) {
            return setDateFormat(obj.effectiveDate);
          }
          return '';
        },
      },
      {
        Header: 'Exp. Date',
        id: 'expectedDate',
        width: 65,
        short: true,
        accessor: (obj): maybeScalar => {
          if (obj?.expirationDate) {
            return setDateFormat(obj.expirationDate);
          }
          return '';
        },
      },
      {
        Header: 'Monday',
        id: 'Monday',
        accessor: (obj): nullableScalar =>
          formatDailySchedule(obj.monday) ?? null,
        width: 100,
        short: true,
      },
      {
        Header: 'Tuesday',
        id: 'Tuesday',
        accessor: (obj): nullableScalar =>
          formatDailySchedule(obj.tuesday) ?? null,
        width: 100,
      },
      {
        Header: 'Wednesday',
        id: 'Wednesday',
        accessor: (obj): nullableScalar =>
          formatDailySchedule(obj.wednesday) ?? null,
        width: 100,
      },
      {
        Header: 'Thursday',
        id: 'Thursday',
        accessor: (obj): nullableScalar =>
          formatDailySchedule(obj.thursday) ?? null,
        width: 100,
      },
      {
        Header: 'Friday',
        id: 'Friday',
        accessor: (obj): nullableScalar =>
          formatDailySchedule(obj.friday) ?? null,
        width: 100,
      },
      {
        Header: 'Saturday',
        id: 'Saturday',
        accessor: (obj): nullableScalar =>
          formatDailySchedule(obj.saturday) ?? null,
        width: 100,
      },
      {
        Header: 'Sunday',
        id: 'Sunday',
        accessor: (obj): nullableScalar =>
          formatDailySchedule(obj.sunday) ?? null,
        width: 100,
      },
    ],
    []
  );
  // const { values } = useFormikContext<DriverInfoExtendedFragment>();

  // // Also check for any schedule that is already added within a given range..
  // const validateTable: ValidateTable<DriverScheduleFormData> = (
  //   values: DriverScheduleFormData[]
  // ) => {
  //   const scheduleRecords =
  //     values?.map((schedule) => ({
  //       ...schedule,
  //       id: v4(),
  //     })) ?? [];
  //   const filteredRecords = scheduleRecords.filter(
  //     (_, index) => index !== scheduleIndex
  //   );

  //   let existingSchedules = [];
  //   if (props.driverId !== undefined) {
  //     const schedules =
  //       scheduleData?.getSchedulesByDriverId.edges.map(({ node }) => node) ||
  //       [];
  //     const uniqueDateSet = new Set();
  //     existingSchedules = schedules.filter((schedule) => {
  //       const key = `${schedule.effectiveDate}-${schedule.expirationDate}`;
  //       if (!uniqueDateSet.has(key)) {
  //         uniqueDateSet.add(key);
  //         return true;
  //       }
  //       return false;
  //     });
  //   } else {
  //     existingSchedules = scheduleRecords.length > 0 ? filteredRecords : [];
  //   }
  //   if (values.length) {
  //     const newSchedule =
  //       props.driverId !== undefined
  //         ? Object.assign({}, values[0])
  //         : Object.assign({}, values[scheduleIndex]);
  //     if (
  //       newSchedule.expirationDate &&
  //       newSchedule.effectiveDate &&
  //       new Date(newSchedule.effectiveDate) >
  //         new Date(newSchedule.expirationDate)
  //     ) {
  //       return {
  //         value: 'Expiration Date must be greater than Effective Date',
  //         type: 'error',
  //       };
  //     }
  //     if (newSchedule) {
  //       const isDateRangeOverlaps = existingSchedules
  //         ?.filter((x) => x.id !== newSchedule.id)
  //         .some((schedule) => {
  //           const newEffectiveDate = new Date(newSchedule.effectiveDate ?? 0);
  //           const newExpirationDate = new Date(newSchedule.expirationDate ?? 0);
  //           const scheduleEffectiveDate = new Date(schedule.effectiveDate ?? 0);
  //           const scheduleExpirationDate = new Date(
  //             schedule.expirationDate ?? 0
  //           );

  //           return (
  //             (newEffectiveDate >= scheduleEffectiveDate &&
  //               newEffectiveDate <= scheduleExpirationDate) ||
  //             (newExpirationDate >= scheduleEffectiveDate &&
  //               newExpirationDate <= scheduleExpirationDate) ||
  //             (!schedule.expirationDate
  //               ? newExpirationDate >= scheduleEffectiveDate
  //               : newExpirationDate >= scheduleExpirationDate &&
  //                 newEffectiveDate <= scheduleEffectiveDate)
  //           );
  //         });

  //       if (isDateRangeOverlaps) {
  //         return {
  //           value:
  //             'This Expiration Date of this schedule overlaps with an existing schedule.',
  //           type: 'error',
  //         };
  //       }
  //     }
  //   }

  //   return null;
  // };

  // return (
  //   <TableInForm<DriverScheduleFormData>
  //     data-testid="scheduling-table"
  //     displayName="Driver Schedule"
  //     formStateKey="schedules"
  //     tableProps={{
  //       id: getTableId('driver-schedule'),
  //       columns,
  //       csvTitle: 'Driver Schedule',
  //       title: props?.title,
  //       minRows: 3,
  //       maxRows: 3,
  //       blankState: (): ReactNode => {
  //         return 'Driver Schedule Not Available';
  //       },
  //       isLoading:
  //         loading || isUpdatingDriverSchedule || isDeletingDriverSchedule,
  //       displayLoadingIcon:
  //         loading || isUpdatingDriverSchedule || isDeletingDriverSchedule,
  //       onScrollToBottom: handleScrollToBottom,
  //     }}
  //     tableData={tableDataMain}
  //     onConfirm={
  //       props.driverId
  //         ? async ({ values: formValues, resetForm }): Promise<void> => {
  //             const input = setScheduledHours('', [formValues], props.driverId);
  //             const response = await submitMutation(() => {
  //               return assetDriverSchedule({
  //                 variables: {
  //                   schedules: input as AssetDriverScheduleInput[],
  //                 },
  //               });
  //             });
  //             if (noTopLevelErrors(response)) {
  //               refetch();
  //               resetForm();
  //             }
  //           }
  //         : null
  //     }
  //     onDelete={
  //       props.driverId
  //         ? async ({ values }): Promise<void> => {
  //             await submitMutation(() => {
  //               return deleteDriverSchedule({
  //                 variables: {
  //                   deleteDriverScheduleId: values.id,
  //                 },
  //               });
  //             });
  //             refetch();
  //           }
  //         : null
  //     }
  //     initialValues={defaultData}
  //     initialTouched={{
  //       expirationDate: true,
  //       effectiveDate: true,
  //     }}
  //     noAddNew={props?.disableAddNew}
  //     onClose={(): void => {
  //       isModalClosed = true;
  //     }}
  //     editDisabled={props?.disableAddNew}
  //     deleteDisabled={props?.disableAddNew}
  //     dialogProps={{
  //       contentStyle: {
  //         overflow: 'auto',
  //         width: driverEnhancementFlag
  //           ? maxTimeRange == 1
  //             ? '35vw'
  //             : maxTimeRange == 2
  //             ? '45vw'
  //             : '70vw'
  //           : '75vw',
  //       },
  //     }}
  //     runTableValidationInDialog
  //     renderModal={(
  //       formValues: DriverScheduleFormData,
  //       isNew,
  //       formProps
  //     ): ReactNode => {
  //       setIsNewForm(isNew);
  //       let initialValues = Object.assign({}, defaultInitialValues);
  //       if (!isNew) {
  //         initialValues = setDefaultInitialValForEdit(formValues);
  //       }
  //       if (isModalClosed && isNew) {
  //         const data = setDefaultInitialValForNew();
  //         formValues = { ...data };
  //         if (formProps.dirty) {
  //           isModalClosed = false;
  //         }
  //       }
  //       const clonedFormVal = jsonParse<DriverScheduleFormData>(
  //         jsonStringify({ ...formValues })
  //       );

  //       return (
  //         <RenderModal
  //           formValues={clonedFormVal as DriverScheduleFormData}
  //           defaultInitialValues={initialValues}
  //           setMaxTimeRange={setMaxTimeRange}
  //           maxTimeRange={maxTimeRange}
  //         />
  //       );
  //     }}
  //     formikProps={{
  //       enableReinitialize: true,
  //     }}
  //     validateTable={validateTable}
  //     initialErrors={getInitialErrors(isNewForm, driverEnhancementFlag)}
  //     validate={(formValues, { index }): ReturnType<typeof required> => {
  //       setScheduleIndex(index ?? 0);
  //       values?.schedules?.map((f: DriverScheduleFormData, idx: number) => {
  //         f.isCurrentEditIdx = index == idx ? true : false;
  //       });
  //       return required(formValues, driverEnhancementFlag);
  //     }}
  //     {...props}
  //   />
  // );

  const { values } = useFormikContext<DriverInfoExtendedFragment>();

  // Also check for any schedule that is already added within a given range.

  const validateTable: ValidateTable<DriverScheduleFormData> = (
    values: DriverScheduleFormData[]
  ) => {
    // Generate unique IDs for the new schedule records
    const scheduleRecords =
      values?.map((schedule) => ({
        ...schedule,
        id: v4(),
      })) ?? [];

    // Filter out the current schedule being edited
    const filteredRecords = scheduleRecords.filter(
      (_, index) => index !== scheduleIndex
    );

    let existingSchedules = [];
    if (props.driverId !== undefined) {
      // Fetch existing schedules for the specified driver
      const schedules =
        scheduleData?.getSchedulesByDriverId.edges.map(({ node }) => node) ||
        [];
      existingSchedules = schedules.length > 0 ? schedules : [];
    } else {
      existingSchedules = scheduleRecords.length > 0 ? filteredRecords : [];
    }

    if (values.length) {
      // Determine the new schedule based on driver ID
      const newSchedule =
        props.driverId !== undefined
          ? Object.assign({}, values[0])
          : Object.assign({}, values[scheduleIndex]);

      // Date validation: Ensure expiration date is greater than effective date
      const effectiveDate = new Date(newSchedule.effectiveDate ?? 0);
      const expirationDate = new Date(newSchedule.expirationDate??0);
      if (effectiveDate && expirationDate && effectiveDate > expirationDate) {
        return {
          value: 'Expiration Date must be greater than Effective Date',
          type: 'error',
        };
      }

      // Check for overlaps in date and time ranges
      const isDateRangeOverlaps = existingSchedules
        .filter((x) => x.id !== newSchedule.id)
        .some((schedule) => {
          const existingEffectiveDate = new Date(schedule.effectiveDate);
          const existingExpirationDate = new Date(schedule.expirationDate);

          // Check for date range overlap
          const isDateOverlap =
            (effectiveDate <= existingExpirationDate &&
              expirationDate >= existingEffectiveDate) ||
            (!schedule.expirationDate &&
              effectiveDate >= existingEffectiveDate);

          // Check for time range overlap
          const daysOfWeek = [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
          ];

          const isTimeOverlap = daysOfWeek.some((day) => {
            const newStartTime = newSchedule[day]?.startTime;
            const newEndTime = newSchedule[day]?.endTime;
            const existingStartTime = schedule[day]?.startTime;
            const existingEndTime = schedule[day]?.endTime;

            if (
              newStartTime &&
              newEndTime &&
              existingStartTime &&
              existingEndTime
            ) {
              // Convert times to comparable values
              const newStart = new Date(`1970-01-01T${newStartTime}:00`);
              const newEnd = new Date(`1970-01-01T${newEndTime}:00`);
              const existingStart = new Date(
                `1970-01-01T${existingStartTime}:00`
              );
              const existingEnd = new Date(`1970-01-01T${existingEndTime}:00`);

              // Check if the time ranges overlap
              return (
                (newStart < existingEnd && newEnd > existingStart) ||
                (!existingEnd && newStart >= existingStart)
              );
            }
            return false; // No overlap if any times are missing
          });

          return isDateOverlap && isTimeOverlap;
        });

      if (isDateRangeOverlaps) {
        return {
          value:
            'This schedule overlaps with an existing schedule in terms of time and date range.',
          type: 'error',
        };
      }
    }

    return null; // No validation errors
  };

  // Example usage of the function
  const schedules = [
    {
      effectiveDate: '2024-10-23', // Ensure this is in a consistent format
      expirationDate: '2024-10-31',
      Monday: { startTime: '03:00', endTime: '04:00' },
      Tuesday: { startTime: '03:00', endTime: '04:00' },
      Wednesday: { startTime: '03:00', endTime: '04:00' },
      Thursday: { startTime: '03:00', endTime: '04:00' },
      Friday: { startTime: '03:00', endTime: '04:00' },
      Saturday: { startTime: '03:00', endTime: '04:00' },
      Sunday: { startTime: '03:00', endTime: '04:00' },
    },
    {
      effectiveDate: '2024-10-24',
      expirationDate: '2024-10-31',
      Monday: { startTime: '05:00', endTime: '06:00' },
      Tuesday: { startTime: '05:00', endTime: '06:00' },
      Wednesday: { startTime: '05:00', endTime: '06:00' },
      Thursday: { startTime: '05:00', endTime: '06:00' },
      Friday: { startTime: '05:00', endTime: '06:00' },
      Saturday: { startTime: '05:00', endTime: '06:00' },
      Sunday: { startTime: '05:00', endTime: '06:00' },
    },
  ];

  // Perform validation
  const validationResult = validateTable(schedules);
  console.log(validationResult); // Display any validation messages

  return (
    <TableInForm<DriverScheduleFormData>
      data-testid="scheduling-table"
      displayName="Driver Schedule"
      formStateKey="schedules"
      tableProps={{
        id: getTableId('driver-schedule'),
        columns,
        csvTitle: 'Driver Schedule',
        title: props?.title,
        minRows: 3,
        maxRows: 3,
        blankState: (): ReactNode => {
          return 'Driver Schedule Not Available';
        },
        isLoading:
          loading || isUpdatingDriverSchedule || isDeletingDriverSchedule,
        displayLoadingIcon:
          loading || isUpdatingDriverSchedule || isDeletingDriverSchedule,
        onScrollToBottom: handleScrollToBottom,
      }}
      tableData={tableDataMain}
      onConfirm={
        props.driverId
          ? async ({ values: formValues, resetForm }): Promise<void> => {
              const input = setScheduledHours('', [formValues], props.driverId);
              const response = await submitMutation(() => {
                return assetDriverSchedule({
                  variables: {
                    schedules: input as AssetDriverScheduleInput[],
                  },
                });
              });
              if (noTopLevelErrors(response)) {
                refetch();
                resetForm();
              }
            }
          : null
      }
      onDelete={
        props.driverId
          ? async ({ values }): Promise<void> => {
              await submitMutation(() => {
                return deleteDriverSchedule({
                  variables: {
                    deleteDriverScheduleId: values.id,
                  },
                });
              });
              refetch();
            }
          : null
      }
      initialValues={defaultData}
      initialTouched={{
        expirationDate: true,
        effectiveDate: true,
      }}
      noAddNew={props?.disableAddNew}
      onClose={(): void => {
        isModalClosed = true;
      }}
      editDisabled={props?.disableAddNew}
      deleteDisabled={props?.disableAddNew}
      dialogProps={{
        contentStyle: {
          overflow: 'auto',
          width: driverEnhancementFlag
            ? maxTimeRange == 1
              ? '35vw'
              : maxTimeRange == 2
              ? '45vw'
              : '70vw'
            : '75vw',
        },
      }}
      runTableValidationInDialog
      renderModal={(
        formValues: DriverScheduleFormData,
        isNew,
        formProps
      ): ReactNode => {
        setIsNewForm(isNew);
        let initialValues = Object.assign({}, defaultInitialValues);
        if (!isNew) {
          initialValues = setDefaultInitialValForEdit(formValues);
        }
        if (isModalClosed && isNew) {
          const data = setDefaultInitialValForNew();
          formValues = { ...data };
          if (formProps.dirty) {
            isModalClosed = false;
          }
        }
        const clonedFormVal = jsonParse<DriverScheduleFormData>(
          jsonStringify({ ...formValues })
        );

        return (
          <RenderModal
            formValues={clonedFormVal as DriverScheduleFormData}
            defaultInitialValues={initialValues}
            setMaxTimeRange={setMaxTimeRange}
            maxTimeRange={maxTimeRange}
          />
        );
      }}
      formikProps={{
        enableReinitialize: true,
      }}
      validateTable={validateTable}
      initialErrors={getInitialErrors(isNewForm, driverEnhancementFlag)}
      validate={(formValues, { index }): ReturnType<typeof required> => {
        setScheduleIndex(index ?? 0);
        values?.schedules?.map((f: DriverScheduleFormData, idx: number) => {
          f.isCurrentEditIdx = index == idx ? true : false;
        });
        return required(formValues, driverEnhancementFlag);
      }}
      {...props}
    />
  );
};