import {
  readContract,
  readContracts,
  writeContract,
  type IContractCall,
  type ReadContractResult,
  type ReadContractsResult,
} from '../dist';

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

declare const calls: IContractCall[];
declare const call: IContractCall;

const read = readContract<string | null>(call);
type SingularReadResult = Awaited<typeof read>;
type SingularReadValue = SingularReadResult['value'];

type SingularReadResultIsGeneric = Expect<
  Equal<SingularReadResult, ReadContractResult<string | null>>
>;
type SingularReadValueIsNotArray = Expect<
  Equal<SingularReadValue, string | null>
>;

const reads = readContracts<[string, number | null]>(calls);
type ReadResult = Awaited<typeof reads>;
type ReadValues = ReadResult['values'];

type ReadResultIsGeneric = Expect<
  Equal<ReadResult, ReadContractsResult<[string, number | null]>>
>;
type ReadTupleIsPreserved = Expect<Equal<ReadValues, [string, number | null]>>;

const write = writeContract<bigint>({
  address: 'token.xlm',
  fn: 'mint',
  args: ['alice.xlm', 1_000_000n],
});
type Submitted = Awaited<typeof write>;
type ContractReturn = Awaited<ReturnType<Submitted['returnValue']>>;

type WriteReturnIsGenericAndNullable = Expect<
  Equal<ContractReturn, bigint | null>
>;

export type ContractReturnTypeAssertions =
  | SingularReadResultIsGeneric
  | SingularReadValueIsNotArray
  | ReadResultIsGeneric
  | ReadTupleIsPreserved
  | WriteReturnIsGenericAndNullable;
