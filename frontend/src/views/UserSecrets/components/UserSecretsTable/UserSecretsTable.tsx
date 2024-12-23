import { useState } from "react";
import { faKey } from "@fortawesome/free-solid-svg-icons";

import {
  EmptyState,
  Pagination,
  Table,
  TableContainer,
  TableSkeleton,
  TBody,
  Th,
  THead,
  Tr
} from "@app/components/v2";
import { useOrganization } from "@app/context";
import { useGetUserSecrets } from "@app/hooks/api/userSecrets";
import { UsePopUpState } from "@app/hooks/usePopUp";

import { UserSecretsRow } from "./UserSecretsRow";

type Props = {
  handlePopUpOpen: (
    popUpName: keyof UsePopUpState<["deleteUserSecret" | "editUserSecret"]>,
    {
      name,
      id
    }: {
      name: string;
      id: string;
    }
  ) => void;
};

export const UserSecretsTable = ({ handlePopUpOpen }: Props) => {
  const { currentOrg } = useOrganization();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  
  const { data, isLoading } = useGetUserSecrets({
    organizationId: currentOrg?.id || "",
    offset: (page - 1) * perPage,
    limit: perPage
  });

  return (
    <TableContainer>
      <Table>
        <THead>
          <Tr>
            <Th>Type</Th>
            <Th>Name</Th>
            <Th>Last Modified</Th>
            <Th>Created By</Th>
            <Th aria-label="actions" className="w-[8.5rem]" />
          </Tr>
        </THead>
        <TBody>
          {isLoading && <TableSkeleton columns={5} innerKey="user-secrets" />}
          {!isLoading &&
            data?.secrets?.map((secret) => (
              <UserSecretsRow 
                key={secret.id} 
                secret={secret} 
                handlePopUpOpen={handlePopUpOpen} 
              />
            ))}
        </TBody>
      </Table>
      {!isLoading &&
        data?.secrets &&
        data?.totalCount > perPage && (
          <Pagination
            count={data.totalCount}
            page={page}
            perPage={perPage}
            onChangePage={(newPage) => setPage(newPage)}
            onChangePerPage={(newPerPage) => setPerPage(newPerPage)}
          />
        )}
      {!isLoading && !data?.secrets?.length && (
        <EmptyState 
          title="No secrets yet" 
          icon={faKey}
        />
      )}
    </TableContainer>
  );
}; 