// 参考文档 https://docs.sui.io/guides/developer/sui-101/using-events
import { EventId, SuiClient, SuiEvent, SuiEventFilter } from '@mysten/sui/client';
import { suiClient, networkConfig, network } from './config';
import * as fs from 'fs';
console.log(process.env.API_URL);

const cursorFile = "./event.cursor";

async function writeFile(filePath: string, data: string): Promise<void> {
  try {
    await fs.promises.writeFile(filePath, data, 'utf8');
    console.log(`文件已成功写入到 ${filePath}`);
  } catch (error) {
    console.error(`写入文件时出错: ${error}`);
  }
}

async function readFile(filePath: string): Promise<string> {
  try {
    const data = await fs.promises.readFile(filePath, 'utf8');
    return data;
  } catch (error) {
    console.error(`读取文件时出错: ${error}`);
    throw error;
  }
}

type SuiEventsCursor = EventId | null | undefined;

type EventExecutionResult = {
	cursor: SuiEventsCursor;
	hasNextPage: boolean;
};

type EventTracker = {
	type: string;
	filter: SuiEventFilter;
	callback: (events: SuiEvent[], type: string) => any;
};

async function sendPostRequestWithMultipartForm(url: string, formData: FormData): Promise<Response> {
	try {
	  const response = await fetch(url, {
		method: 'POST',
		headers: {
		  // 通常不需要手动设置 Content-Type，因为 FormData 会自动生成正确的边界字符串
		},
		body: formData,
	  });
  
	  if (!response.ok) {
		throw new Error(`HTTP error! Status: ${response.status}`);
	  }
  
	  return response;
	} catch (error) {
	  console.error('Error during fetch POST request:', error);
	  throw error;
	}
  }
  
  

const handleGameConfirm = async (events: SuiEvent[], type: string) => {
	const url = process.env.API_URL as string;
	events.forEach(event=>{
		const formData = new FormData();
		const {id} = event.parsedJson as {id:string};
		formData.append('action', 'confirm');
		formData.append('action', id);
		// formData.append('file', fileInputElement.files); // 假设 fileInputElement 是一个 <input type="file"> 元素
		sendPostRequestWithMultipartForm(url, formData)
			.then(response => response.json())
			.then(data => {
				console.log('Success:', data);
			})
			.catch(error => {
				console.error('Error:', error);
			});
	});
}

const handleNewGuess = async (events: SuiEvent[], type: string) => {
	const url = process.env.API_URL as string;
	events.forEach(event=>{
		const formData = new FormData();
		const {id, guess, owner} = event.parsedJson as {id:string, guess:string, owner:string};
		formData.append('action', 'guess');
		formData.append('action', id);
		formData.append('guess', guess);
		formData.append('owner', owner);
		// formData.append('file', fileInputElement.files); // 假设 fileInputElement 是一个 <input type="file"> 元素
		sendPostRequestWithMultipartForm(url, formData)
			.then(response => response.json())
			.then(data => {
				console.log('Success:', data);
			})
			.catch(error => {
				console.error('Error:', error);
			});
	});
}

const handleGameEvents = async (events: SuiEvent[], type: string) => {
	const url = process.env.API_URL as string;
	events.forEach(event=>{
		const formData = new FormData();
		if(event.type.indexOf("GameCreated")>0){
			const {gid} = event.parsedJson as {gid:string};
			formData.append('action', 'confirm');
			formData.append('id', gid);
		}
		else{
			const {gid, guess, owner} = event.parsedJson as {gid:string, guess:string, owner:string};
			formData.append('action', 'guess');
			formData.append('id', gid);
			formData.append('guess', guess);
			formData.append('owner', owner);
		}
		// formData.append('file', fileInputElement.files); // 假设 fileInputElement 是一个 <input type="file"> 元素
		sendPostRequestWithMultipartForm(url, formData)
			.then(response => response.json())
			.then(data => {
				console.log('Success:', data);
			})
			.catch(error => {
				console.error('Error:', error);
			});
	});
}

const EVENTS_TO_TRACK: EventTracker[] = [
	{
		type: `${networkConfig.testnet.variables.packageId}::GameCreated`,
		filter: {
			MoveEventModule: {
				module: 'nygame',
				package: networkConfig.testnet.variables.packageId,
			},
		},
		callback: handleGameEvents,
	},
	// {
	// 	type: `${networkConfig.testnet.variables.packageId}::NewGuess`,
	// 	filter: {
	// 		MoveEventModule: {
	// 			module: 'nygame',
	// 			package: networkConfig.testnet.variables.packageId,
	// 		},
	// 		MoveEventType: "NewGuess",
	// 	},
	// 	callback: handleNewGuess,
	// },
];

const executeEventJob = async (
	client: SuiClient,
	tracker: EventTracker,
	cursor: SuiEventsCursor,
): Promise<EventExecutionResult> => {
	try {
		const { data, hasNextPage, nextCursor } = await client.queryEvents({
			query: tracker.filter,
			cursor,
			order: 'ascending',
		});

		console.log(111, tracker.type);
		await tracker.callback(data, tracker.type);
		// console.log(222, tracker.type);
		console.log(data);
		if (nextCursor && data.length > 0) {
			await saveLatestCursor(tracker, nextCursor);

			return {
				cursor: nextCursor,
				hasNextPage,
			};
		}
	} catch (e) {
		console.error(e);
	}
	return {
		cursor,
		hasNextPage: false,
	};
};

const runEventJob = async (client: SuiClient, tracker: EventTracker, cursor: SuiEventsCursor) => {
	const result = await executeEventJob(client, tracker, cursor);

	setTimeout(
		() => {
			runEventJob(client, tracker, result.cursor);
		},
		result.hasNextPage ? 0 : 500,
	);
};

/**
 * Gets the latest cursor for an event tracker, either from the DB (if it's undefined)
 *	or from the running cursors.
 */
const getLatestCursor = async (tracker: EventTracker) => {
	// const cursor = await prisma.cursor.findUnique({
	// 	where: {
	// 		id: tracker.type,
	// 	},
	// });
	// 使用示例
	readFile(cursorFile+tracker.type).then(data => {
		console.log(`文件内容: ${data}`);
		const arr = data.split("|");
		const cursor: SuiEventsCursor = {
			eventSeq: arr[0],
			txDigest: arr[1]
		} ;//arr[0], arr[1]
		return cursor;
	}).catch(error => {
		// 处理读取文件时出现的错误
		console.log(error);
	});

	// return cursor || undefined;
    return undefined;
};

/**
 * Saves the latest cursor for an event tracker to the db, so we can resume
 * from there.
 * */
const saveLatestCursor = async (tracker: EventTracker, cursor: EventId) => {
	// const data = {
	// 	eventSeq: cursor.eventSeq,
	// 	txDigest: cursor.txDigest,
	// };

	// return prisma.cursor.upsert({
	// 	where: {
	// 		id: tracker.type,
	// 	},
	// 	update: data,
	// 	create: { id: tracker.type, ...data },
	// });
	writeFile(cursorFile+tracker.type, cursor.eventSeq+"|"+cursor.txDigest)
};

export const setupListeners = async () => {
	for (const event of EVENTS_TO_TRACK) {
		runEventJob(suiClient, event, await getLatestCursor(event));
	}
};