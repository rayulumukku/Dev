"use server";

export async function addTodoItem(formData) {
  const title = formData.get('title');
  if (!title) {
    throw new Error('Title is required for Todo mutation');
  }
  console.log(`[Server Action] Processing mutation for Todo item: ${title}`);
  return { success: true, id: Date.now(), title };
}
